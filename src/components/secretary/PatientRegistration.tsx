import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, Save, Stethoscope } from 'lucide-react';
import { authService } from '../../service/auth';
import { MedecinApiService } from '../../service/medecinApi';
import { SecretaryApiService } from '../../service/SecretaryApiService';
import { RegisterData } from '../../types';

// Define Medecin type for the dropdown
interface Medecin {
  _id: string;
  nom: string;
  prenom: string;
  specialite?: string;
}

interface PatientRegistrationProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string | null; // Optional patientId for edit mode
}

export default function PatientRegistration({ token, onClose, onSuccess, patientId }: PatientRegistrationProps) {
  const [formData, setFormData] = useState<RegisterData>({
    nom: '',
    prenom: '',
    email: '',
    numero: '',
    dateNaissance: '',
    adresse: '',
    motDePasse: '',
    role: 'Patient',
    sexe: '',
    groupeSanguin: '',
    Medecins: [],
  });
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditMode = !!patientId; // Determine if in edit mode

  // Fetch doctors and patient data (if editing)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch doctors
        const doctors = await MedecinApiService.getMedecinsBySecretaire(token);
        setMedecins(doctors);

        // Fetch patient data if in edit mode
        if (patientId) {
          setLoading(true);
          const patient = await SecretaryApiService.getPatientById(token, patientId);
          setFormData({
            nom: patient.nom || '',
            prenom: patient.prenom || '',
            email: patient.email || '',
            numero: patient.numero || '',
            dateNaissance: patient.dateNaissance ? new Date(patient.dateNaissance).toISOString().split('T')[0] : '',
            adresse: patient.adresse || '',
            motDePasse: '', // Do not pre-fill password for security
            role: 'Patient',
            sexe: patient.sexe || '',
            groupeSanguin: patient.groupeSanguin || '',
            Medecins: patient.Medecins || [],
          });
        }
      } catch (error) {
        setError('Erreur lors du chargement des données');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, patientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'medecins') {
      const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions).map(option => option.value);
      setFormData({ ...formData, Medecins: selectedOptions });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        // Update patient
        await SecretaryApiService.updatePatient(token, patientId, {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          numero: formData.numero,
          dateNaissance: formData.dateNaissance,
          adresse: formData.adresse,
          sexe: formData.sexe,
          groupeSanguin: formData.groupeSanguin,
          Medecins: formData.Medecins!.length ? formData.Medecins : undefined,
        });
      } else {
        // Create patient
        await authService.register({
          ...formData,
          numero: formData.numero,
          role: 'Patient',
          Medecins: formData.Medecins!.length ? formData.Medecins : undefined,
        });
      }
      onSuccess();
    } catch (error: any) {
      setError(error.message || `Erreur lors de la ${isEditMode ? 'mise à jour' : 'création'} du patient`);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} patient:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Modifier le patient' : 'Nouveau patient'}
          </h2>
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
                <User className="w-4 h-4 inline mr-2" />
                Nom *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Nom de famille"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Prénom *
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Prénom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="email@exemple.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone *
              </label>
              <input
                type="tel"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                required
                pattern="\+?\d{1,4}?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,9}"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date de naissance *
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Adresse *
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Adresse complète"
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe temporaire *
              </label>
              <input
                type="password"
                name="motDePasse"
                value={formData.motDePasse}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Mot de passe temporaire"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexe
              </label>
              <select
                name="sexe"
                value={formData.sexe}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sélectionner</option>
                <option value="Homme">Masculin</option>
                <option value="Femme">Féminin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Groupe sanguin *
              </label>
              <select
                name="groupeSanguin"
                value={formData.groupeSanguin}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sélectionner</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Stethoscope className="w-4 h-4 inline mr-2" />
              Médecins
            </label>
            <select
              name="medecins"
              multiple
              value={formData.Medecins}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px]"
            >
              {medecins.map((medecin) => (
                <option key={medecin._id} value={medecin._id}>
                  {medecin.prenom} {medecin.nom} {medecin.specialite ? `(${medecin.specialite})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Mettre à jour' : 'Créer le patient'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}