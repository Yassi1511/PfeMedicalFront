import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Edit, Search, Pill } from 'lucide-react';
import { TraitementApiService, CreateTraitementDTO, UpdateTraitementDTO, Traitement, MedicamentTraitement } from '../../service/traitementApiService';
import { PatientInfo, SecretaryApiService } from '../../service/SecretaryApiService'; // Import the patient API

interface TraitementManagementProps {
  token: string;
  onClose: () => void;
}

export default function TraitementManagement({ token, onClose }: TraitementManagementProps) {
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const [patients, setPatients] = useState<PatientInfo[]>([]); // State for patients
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTraitement, setEditingTraitement] = useState<Traitement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newTraitement, setNewTraitement] = useState<CreateTraitementDTO>({
    nom: '',
    observations: '',
    patientId: '', // Add patient field
    medicaments: [],
  });
  const [newMedicament, setNewMedicament] = useState<MedicamentTraitement>({
    nomCommercial: '',
    dosage: '',
    frequence: 1,
    voieAdministration: '',
    dateDebut: '',
    dateFin: '',
    horaires: [],
  });
  const [horairesInput, setHorairesInput] = useState<string>(''); // New state for raw horaires input

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [traitementsData, patientsData] = await Promise.all([
        TraitementApiService.getAllTraitements(token),
        SecretaryApiService.getPatientsByMedecinId(token, localStorage.getItem('id') || ''), // Fetch patients
      ]);
      setTraitements(traitementsData);
      setPatients(patientsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTraitement = async () => {
    try {
      setError(null);
      if (!newTraitement.nom) {
        setError('Le nom du traitement est obligatoire.');
        return;
      }
      if (!newTraitement.medicaments.length) {
        setError('Au moins un médicament est requis.');
        return;
      }
      const medecinId = localStorage.getItem('id');
      if (!medecinId) {
        setError('ID du médecin non trouvé dans le stockage local.');
        return;
      }
      const traitementData: CreateTraitementDTO = {
        ...newTraitement,
        patientId: newTraitement.patientId || undefined, // Include patient if selected
      };
      await TraitementApiService.createTraitement(traitementData, token);
      setNewTraitement({
        nom: '',
        observations: '',
        patientId: '',
        medicaments: [],
      });
      setShowCreateForm(false);
      await loadData();
    } catch (err: any) {
      console.error('Error creating treatment:', err);
      setError(err.message || 'Erreur lors de la création du traitement.');
    }
  };

  const handleUpdateTraitement = async () => {
    if (!editingTraitement) return;
    try {
      setError(null);
      const medecinId = localStorage.getItem('id');
      if (!medecinId) {
        setError('ID du médecin non trouvé dans le stockage local.');
        return;
      }
      const updateData: UpdateTraitementDTO = {
        nom: newTraitement.nom || undefined,
        observations: newTraitement.observations || undefined,
        patientId: newTraitement.patientId || undefined, // Include patient if selected
        medicaments: newTraitement.medicaments.length > 0 ? newTraitement.medicaments : undefined,
      };
      await TraitementApiService.updateTraitement(editingTraitement._id, updateData, token);
      setEditingTraitement(null);
      setNewTraitement({
        nom: '',
        observations: '',
        patientId: '',
        medicaments: [],
      });
      setHorairesInput(''); // Clear horairesInput on form reset
      await loadData();
    } catch (err: any) {
      console.error('Error updating treatment:', err);
      setError(err.message || 'Erreur lors de la mise à jour du traitement.');
    }
  };

  const handleDeleteTraitement = async (traitementId: string) => {
    try {
      setError(null);
      await TraitementApiService.deleteTraitement(traitementId, token);
      setShowDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting treatment:', err);
      setError(err.message || 'Erreur lors de la suppression du traitement.');
    }
  };

  const handleAddMedicament = () => {
    if (!newMedicament.nomCommercial || !newMedicament.dosage || !newMedicament.voieAdministration || !newMedicament.dateDebut || !newMedicament.dateFin) {
      setError('Tous les champs du médicament sont obligatoires.');
      return;
    }
    // Convert horairesInput to array for newMedicament
    const horairesArray = horairesInput
      .split(';')
      .map(h => h.trim())
      .filter(h => h);
    setNewTraitement({
      ...newTraitement,
      medicaments: [...newTraitement.medicaments, { ...newMedicament, horaires: horairesArray }],
    });
    setNewMedicament({
      nomCommercial: '',
      dosage: '',
      frequence: 1,
      voieAdministration: '',
      dateDebut: '',
      dateFin: '',
      horaires: [],
    });
    setHorairesInput(''); // Clear the input field
  };

  const handleRemoveMedicament = (index: number) => {
    setNewTraitement({
      ...newTraitement,
      medicaments: newTraitement.medicaments.filter((_, i) => i !== index),
    });
  };

  const filteredTraitements = traitements.filter(traitement =>
    traitement.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des Traitements</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 right-0 px-4 py-3">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" viewBox="0 0 20 20">
                <path d="M14.348 14.849a1 1 0 01-1.414 0L10 11.414l-2.934 2.935a1 1 0 01-1.414-1.414L8.586 10 5.652 7.065a1 1 0 011.414-1.414L10 8.586l2.934-2.935a1 1 0 011.414 1.414L11.414 10l2.934 2.935a1 1 0 010 1.414z" />
              </svg>
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un traitement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Create/Edit Form */}
          {(showCreateForm || editingTraitement) && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingTraitement ? 'Modifier le traitement' : 'Nouveau traitement'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom du traitement</label>
                  <input
                    type="text"
                    value={newTraitement.nom}
                    onChange={(e) => setNewTraitement({ ...newTraitement, nom: e.target.value })}
                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: Traitement pour hypertension"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient</label>
                  <select
                    value={newTraitement.patientId || ''}
                    onChange={(e) => setNewTraitement({ ...newTraitement, patientId: e.target.value })}
                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Aucun patient</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.prenom} {patient.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Observations</label>
                  <textarea
                    value={newTraitement.observations}
                    onChange={(e) => setNewTraitement({ ...newTraitement, observations: e.target.value })}
                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Notes ou observations supplémentaires"
                  />
                </div>
                {/* Medicament Form */}
                <div className="col-span-1 sm:col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ajouter un médicament</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom commercial</label>
                      <input
                        type="text"
                        value={newMedicament.nomCommercial}
                        onChange={(e) => setNewMedicament({ ...newMedicament, nomCommercial: e.target.value })}
                        className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ex: Paracétamol"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dosage</label>
                      <input
                        type="text"
                        value={newMedicament.dosage}
                        onChange={(e) => setNewMedicament({ ...newMedicament, dosage: e.target.value })}
                        className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ex: 500mg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fréquence (par jour)</label>
                      <input
                        type="number"
                        min="1"
                        value={newMedicament.frequence}
                        onChange={(e) => setNewMedicament({ ...newMedicament, frequence: parseInt(e.target.value) || 1 })}
                        className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Voie d'administration</label>
                      <select
                        value={newMedicament.voieAdministration}
                        onChange={(e) => setNewMedicament({ ...newMedicament, voieAdministration: e.target.value })}
                        className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Orale">Orale</option>
                        <option value="Intraveineuse">Intraveineuse</option>
                        <option value="Topique">Topique</option>
                        <option value="Inhalation">Inhalation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date de début</label>
                      <input
                        type="date"
                        value={newMedicament.dateDebut}
                        onChange={(e) => setNewMedicament({ ...newMedicament, dateDebut: e.target.value })}
                        className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                      <input
                        type="date"
                        value={newMedicament.dateFin}
                        onChange={(e) => setNewMedicament({ ...newMedicament, dateFin: e.target.value })}
                        className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Horaires (séparés par point-virgule, optionnel)</label>
                      <input
                        type="text"
                        value={horairesInput}
                        onChange={(e) => setHorairesInput(e.target.value)}
                        className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ex: 08:00;12:00;20:00"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <button
                        onClick={handleAddMedicament}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter le médicament
                      </button>
                    </div>
                  </div>
                  {/* Display Added Medicaments */}
                  {newTraitement.medicaments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {newTraitement.medicaments.map((med, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{med.nomCommercial}</p>
                            <p className="text-sm text-gray-600">Dosage: {med.dosage}, Fréquence: {med.frequence}x/jour</p>
                            <p className="text-sm text-gray-600">Horaires: {med.horaires?.join(', ') || 'Non défini'}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveMedicament(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={editingTraitement ? handleUpdateTraitement : handleCreateTraitement}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingTraitement ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTraitement(null);
                    setNewTraitement({ nom: '', observations: '', patientId: '', medicaments: [] });
                    setHorairesInput(''); // Clear horairesInput on form reset
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer ce traitement ? Cette action est irréversible.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDeleteTraitement(showDeleteConfirm)}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Treatments List */}
          <div className="space-y-4">
            {!showCreateForm && !editingTraitement && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouveau traitement
              </button>
            )}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Chargement...</p>
              </div>
            ) : filteredTraitements.length > 0 ? (
              filteredTraitements.map((traitement) => (
                <div key={traitement._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{traitement.nom}</h4>
                      </div>
                      <p className="text-sm text-gray-600">Médecin: {traitement.medecin.prenom} {traitement.medecin.nom} ({traitement.medecin.specialite})</p>
                      {traitement.patient && (
                        <p className="text-sm text-gray-600">Patient: {traitement.patient.prenom} {traitement.patient.nom}</p>
                      )}
                      {traitement.observations && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Observations:</span> {traitement.observations}
                        </p>
                      )}
                      {traitement.medicaments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Médicaments:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {traitement.medicaments.map((med) => (
                              <li key={med._id}>
                                {med.nomCommercial} - {med.dosage}, {med.frequence}x/jour ({med.voieAdministration})
                                {med.horaires.length > 0 && `, Horaires: ${med.horaires.join(', ')}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTraitement(traitement);
                          setNewTraitement({
                            nom: traitement.nom,
                            observations: traitement.observations || '',
                            patientId: traitement.patient?._id || '',
                            medicaments: traitement.medicaments.map(med => ({
                              nomCommercial: med.nomCommercial,
                              dosage: med.dosage,
                              frequence: med.frequence,
                              voieAdministration: med.voieAdministration,
                              dateDebut: med.dateDebut.split('T')[0],
                              dateFin: med.dateFin.split('T')[0],
                              horaires: med.horaires,
                            })),
                          });
                          // Set horairesInput for the first medicament when editing
                          setHorairesInput(traitement.medicaments[0]?.horaires?.join('; ') || '');
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(traitement._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? 'Aucun traitement trouvé' : 'Aucun traitement enregistré'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}