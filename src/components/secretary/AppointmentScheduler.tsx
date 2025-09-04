import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, Save, Trash2 } from 'lucide-react';
import { SecretaryApiService } from '../../service/SecretaryApiService';

interface AppointmentSchedulerProps {
  token: string;
  patients: Array<{ id: string; nom: string; prenom: string }>;
  onClose: () => void;
  onSuccess: () => void;
  rdvId?: string; // Added for edit mode
}

interface Medecin {
  _id: string;
  nom: string;
  prenom: string;
  specialite: string;
  email: string;
}

interface PatientInfo {
  id: string;
  nom: string;
  prenom: string;
}

export default function AppointmentScheduler({ token, patients, onClose, onSuccess, rdvId }: AppointmentSchedulerProps) {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientInfo[]>(patients);
  const [formData, setFormData] = useState({
    patientId: '',
    medecinId: '',
    date: '',
    heure: '',
    commentaire: '',
    statut: 'en_attente',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingMedecins, setFetchingMedecins] = useState(true);
  const [fetchingPatients, setFetchingPatients] = useState(false);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!!rdvId); // Added to detect edit mode

  useEffect(() => {
    loadMedecins();
    if (rdvId) {
      loadRendezVous(); // Added to load existing data in edit mode
    }
  }, [rdvId]);

  useEffect(() => {
    if (formData.medecinId) {
      loadPatientsByMedecin();
    } else {
      setFilteredPatients(patients);
      setFetchingPatients(false);
    }
  }, [formData.medecinId, patients]);

  useEffect(() => {
    if (formData.medecinId && formData.date && formData.heure && !isEditing) { // Skip availability check in edit mode
      checkAvailability();
    } else {
      setIsAvailable(null);
      setFetchingAvailability(false);
    }
  }, [formData.medecinId, formData.date, formData.heure, isEditing]);

  const loadMedecins = async () => {
    setFetchingMedecins(true);
    try {
      const response = await SecretaryApiService.getMedecins(token);
      const medecinsList = Array.isArray(response) ? response : response.medecins || [];
      setMedecins(medecinsList);
    } catch (error) {
      console.error('Error loading medecins:', error);
      setError('Erreur lors du chargement des médecins');
      setMedecins([]);
    } finally {
      setFetchingMedecins(false);
    }
  };

  const loadPatientsByMedecin = async () => {
    setFetchingPatients(true);
    try {
      const response = await SecretaryApiService.getPatientsByMedecinId(token, formData.medecinId);
      const patientsWithIds = response.map((p: any) => {
        if (!p.id && !p._id) {
          console.warn('Patient missing ID:', p);
        }
        return { id: p.id || p._id, nom: p.nom, prenom: p.prenom };
      });
      setFilteredPatients(patientsWithIds);
    } catch (error) {
      console.error('Error loading patients for medecin:', error);
      setError('Erreur lors du chargement des patients pour ce médecin');
      setFilteredPatients(patients);
    } finally {
      setFetchingPatients(false);
    }
  };

  const loadRendezVous = async () => { // Updated to fix dropdown pre-filling
    setLoading(true);
    try {
      const response = await SecretaryApiService.getRendezVousById(token, rdvId!);
      setFormData({
        patientId: response.patientId._id, // Use _id string
        medecinId: response.medecinId._id, // Use _id string
        date: response.date,
        heure: response.heure,
        commentaire: response.commentaire || '',
        statut: response.statut,
      });
      setIsAvailable(true); // Assume available since it's existing
      if (response.medecinId._id) {
        loadPatientsByMedecin(); // Reload patients based on selected medecin
      }
    } catch (error) {
      console.error('Error loading rendez-vous:', error);
      setError('Erreur lors du chargement du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    setFetchingAvailability(true);
    try {
      const response = await SecretaryApiService.getMedecinAvailability(token, formData.medecinId, formData.date, formData.heure);
      setIsAvailable(response);
    } catch (error) {
      console.error('Error checking availability:', error);
      setError('Erreur lors de la vérification de la disponibilité');
      setIsAvailable(null);
    } finally {
      setFetchingAvailability(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.medecinId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid medecinId format');
      }
      if (!formData.patientId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid patientId format');
      }

      const payload = {
        medecinId: formData.medecinId,
        patientId: formData.patientId,
        date: formData.date,
        heure: formData.heure,
        statut: formData.statut,
        commentaire: formData.commentaire || undefined,
      };

      if (isEditing) {
        await SecretaryApiService.updateRendezVous(token, rdvId!, payload); // Use update in edit mode
      } else {
        if (formData.medecinId && formData.date && formData.heure) {
          const isAvailable = await SecretaryApiService.getMedecinAvailability(token, formData.medecinId, formData.date, formData.heure);
          if (!isAvailable) {
            setError('Le médecin n\'est pas disponible à ce créneau.');
            setLoading(false);
            return;
          }
        }
        await SecretaryApiService.createRendezVous(token, payload);
      }
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || `Erreur lors de la ${isEditing ? 'mise à jour' : 'création'} du rendez-vous`);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} appointment:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => { // Added for delete in edit mode
    if (!rdvId || !window.confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) return;
    setLoading(true);
    setError('');
    try {
      await SecretaryApiService.deleteRendezVous(token, rdvId);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression du rendez-vous');
      console.error('Error deleting appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  console.log('Rendering with medecins:', medecins, 'fetchingMedecins:', fetchingMedecins, 'filteredPatients:', filteredPatients, 'isAvailable:', isAvailable);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Modifier un rendez-vous' : 'Planifier un rendez-vous'}</h2> {/* Changed title for edit mode */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Stethoscope className="w-4 h-4 inline mr-2" />
                Médecin *
              </label>
              <select
                name="medecinId"
                value={formData.medecinId}
                onChange={handleChange}
                required
                disabled={fetchingMedecins}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sélectionner un médecin</option>
                {fetchingMedecins ? (
                  <option value="" disabled>Chargement des médecins...</option>
                ) : medecins.length > 0 ? (
                  medecins.map((medecin) => (
                    <option key={medecin._id} value={medecin._id}>
                      {medecin.nom} {medecin.prenom} - {medecin.specialite}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Aucun médecin disponible</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Patient *
              </label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                disabled={fetchingPatients}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sélectionner un patient</option>
                {fetchingPatients ? (
                  <option value="" disabled>Chargement des patients...</option>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.prenom} {patient.nom}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Aucun patient disponible</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Heure *
              </label>
              <select
                name="heure"
                value={formData.heure}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sélectionner une heure</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {fetchingAvailability ? (
                <p className="text-sm text-gray-500 mt-2">Vérification de la disponibilité...</p>
              ) : isAvailable !== null ? (
                <p className={`text-sm mt-2 ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isAvailable ? 'Disponible' : 'Non disponible'}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              name="commentaire"
              value={formData.commentaire}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Commentaires additionnels..."
            />
          </div>

          <div className="flex gap-4">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || (!isEditing && isAvailable === false)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Mettre à jour' : 'Planifier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}