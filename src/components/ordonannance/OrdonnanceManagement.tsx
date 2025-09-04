import { useState, useEffect } from 'react';
import { FileText, User, X, Search, Plus, Download, AlertTriangle } from 'lucide-react';
import { Ordonnance, Patient, Traitement } from '../../types/medecin';
import { OrdonnanceApiService } from '../../service/ordonnanceApi';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  _id: string;
  role: string;
  [key: string]: any;
}

interface OrdonnanceManagementProps {
  token: string;
  medecinId: string;
  onClose: () => void;
}

export default function OrdonnanceManagement({ token, onClose }: OrdonnanceManagementProps) {
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const [medecinId, setMedecinId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrdonnance, setNewOrdonnance] = useState<{
    destination: string;
    traitement: string;
    signatureElectronique?: File;
  }>({ destination: '', traitement: '' });
  const [error, setError] = useState<string | null>(null);
  const [dropdownError, setDropdownError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('Token payload:', decoded);
      if (!decoded._id) {
        throw new Error('No doctor ID found in token');
      }
      setMedecinId(decoded._id);
    } catch (error) {
      console.error('Error decoding token:', error);
      setDropdownError('Erreur: Impossible de récupérer l’ID du médecin. Veuillez vous reconnecter.');
    }
  }, [token]);

  useEffect(() => {
    if (medecinId) {
      loadOrdonnances();
      loadPatientsAndTraitements();
    }
  }, [medecinId]);

  useEffect(() => {
    console.log('Patients:', patients);
    console.log('Traitements:', traitements);
    console.log('medecinId:', medecinId);
    console.log('Ordonnances state:', ordonnances);
    console.log('Filtered ordonnances:', filteredOrdonnances);
    console.log('Search term:', searchTerm);
  }, [patients, traitements, medecinId, ordonnances, searchTerm]);

  const loadOrdonnances = async () => {
    try {
      setIsLoading(true);
      const data = await OrdonnanceApiService.getOrdonnancesByMedecin(token);
      console.log('loadOrdonnances setting ordonnances:', data);
      setOrdonnances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading ordonnances:', error);
      setOrdonnances([]);
      setError('Erreur lors du chargement des ordonnances');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientsAndTraitements = async () => {
    try {
      if (!medecinId) {
        setDropdownError('ID de médecin non disponible. Veuillez vous reconnecter.');
        return;
      }
      const [patientsData, traitementsData] = await Promise.all([
        OrdonnanceApiService.getPatients(token, medecinId),
        OrdonnanceApiService.getTraitementsByMedecin(token, medecinId),
      ]);
      const validPatients = Array.isArray(patientsData) ? patientsData : [];
      const validTraitements = Array.isArray(traitementsData) ? traitementsData : [];
      console.log('Fetched patients:', validPatients);
      console.log('Fetched traitements:', validTraitements);
      setPatients(validPatients);
      setTraitements(validTraitements);
      if (validPatients.length === 0) {
        setDropdownError('Aucun patient disponible. Vérifiez votre liste de patients.');
      }
      if (validTraitements.length === 0) {
        setDropdownError((prev) =>
          prev ? `${prev} Aucun traitement disponible.` : 'Aucun traitement disponible.'
        );
      }
    } catch (error) {
      console.error('Error loading patients or traitements:', error);
      setDropdownError('Erreur lors du chargement des patients ou traitements');
    }
  };

  const handleAddOrdonnance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrdonnance.destination || !newOrdonnance.traitement) {
      setError('Veuillez sélectionner un patient et un traitement');
      return;
    }
    try {
      setError(null);
      const ordonnance = await OrdonnanceApiService.ajouterOrdonnance(
        token,
        newOrdonnance.destination,
        newOrdonnance.traitement,
        newOrdonnance.signatureElectronique
      );
      setOrdonnances([...ordonnances, ordonnance]);
      setNewOrdonnance({ destination: '', traitement: '' });
      setShowAddForm(false);
    } catch (error: any) {
      setError(error.message || "Erreur lors de la création de l'ordonnance");
    }
  };

  const filteredOrdonnances = ordonnances.filter((ord) => {
    const searchString = ord.destination
      ? `${ord.destination.prenom || ''} ${ord.destination.nom || ''}`.toLowerCase()
      : '';
    console.log('Filtering ordonnance:', ord, 'Search string:', searchString, 'Matches:', searchString.includes(searchTerm.toLowerCase()));
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Gestion des Ordonnances</h2>
                <p className="text-purple-100">
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-600 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  console.log('Nouvelle Ordonnance button clicked, medecinId:', medecinId);
                  setShowAddForm(true);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                  patients.length === 0 || traitements.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                disabled={patients.length === 0 || traitements.length === 0}
              >
                <Plus className="w-5 h-5" />
                Nouvelle Ordonnance
              </button>
              {(patients.length === 0 || traitements.length === 0) && (
                <p className="text-sm text-red-600 mt-2">
                  {patients.length === 0 && traitements.length === 0
                    ? 'Aucun patient ni traitement disponible.'
                    : patients.length === 0
                    ? 'Aucun patient disponible.'
                    : 'Aucun traitement disponible.'}
                </p>
              )}
            </div>
          </div>
          {showAddForm && (
            <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Créer une nouvelle ordonnance</h3>
              {error && (
                <p className="text-red-600 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {error}
                </p>
              )}
              {dropdownError && (
                <p className="text-yellow-600 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {dropdownError}
                </p>
              )}
              <form onSubmit={handleAddOrdonnance} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <select
                    value={newOrdonnance.destination}
                    onChange={(e) => setNewOrdonnance({ ...newOrdonnance, destination: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.prenom} {patient.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Traitement</label>
                  <select
                    value={newOrdonnance.traitement}
                    onChange={(e) => setNewOrdonnance({ ...newOrdonnance, traitement: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Sélectionner un traitement</option>
                    {traitements.map((traitement) => (
                      <option key={traitement._id} value={traitement._id}>
                        {traitement.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature électronique</label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.svg"
                    onChange={(e) =>
                      setNewOrdonnance({
                        ...newOrdonnance,
                        signatureElectronique: e.target.files?.[0],
                      })
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="md:col-span-3 flex gap-4 mt-4">
                  <button
                    type="submit"
                    className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : filteredOrdonnances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Aucune ordonnance trouvée</p>
                {searchTerm && <p className="text-sm mt-2">Essayez de vider la recherche pour voir toutes les ordonnances.</p>}
              </div>
            ) : (
              filteredOrdonnances.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {ord.destination?.prenom || 'Inconnu'} {ord.destination?.nom || 'Inconnu'}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Traitement:</strong> {ord.traitement?.nom || 'N/A'}
                          </p>
                          <p>
                            <strong>Date d'émission:</strong>{' '}
                            {new Date(ord.dateEmission).toLocaleDateString('fr-FR')}
                          </p>
                          {ord.signatureElectronique && (
                            <a
                              href={`/uploads/${ord.signatureElectronique}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-purple-600 hover:underline"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger la signature
                            </a>
                          )}
                        </div>
                        {ord.traitement?.medicaments?.length > 0 ? (
                          <div className="mt-2">
                            <strong>Médicaments:</strong>
                            <ul className="list-disc pl-5 text-sm text-gray-600">
                              {ord.traitement.medicaments.map((med) => (
                                <li key={med._id}>
                                  {med.nomCommercial || 'N/A'} - {med.dosage || 'N/A'} (
                                  {med.frequence ? `${med.frequence} fois/jour` : 'Fréquence non spécifiée'},{' '}
                                  {med.voieAdministration || 'N/A'})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mt-2">Aucun médicament associé</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}