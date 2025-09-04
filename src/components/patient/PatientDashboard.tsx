import { useState, useEffect } from 'react';
import { Calendar, FileText, User, Clock, Pill as Pills, Activity } from 'lucide-react';
import { PatientApiService } from '../../service/PatientApiService';
import { RendezVous, Ordonnance, Medicament, OrdonnanceAPI, CreateMedicamentDTO } from '../../types/patient';

interface PatientDashboardProps {
  user: { token: string; prenom: string; id: string };
  onOpenProfile: () => void;
}

export default function PatientDashboard({ user, onOpenProfile }: PatientDashboardProps) {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rdv');
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [detailedOrdonnances, setDetailedOrdonnances] = useState<{ [key: string]: OrdonnanceAPI }>({});
  const [newMedicament, setNewMedicament] = useState<CreateMedicamentDTO>({
    dateDebut: '',
    dateFin: '',
    dosage: '',
    frequence: 1,
    nomCommercial: '',
    voieAdministration: '',
    horaires: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [showMedicamentForm, setShowMedicamentForm] = useState(false);
  const [horairesInput, setHorairesInput] = useState('');

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rdvData, ordData, medData] = await Promise.all([
        PatientApiService.getRendezVous(user.token),
        PatientApiService.getOrdonnances(user.token),
        PatientApiService.getMedicaments(user.token)
      ]);
      setRendezVous(rdvData);
      setOrdonnances(ordData);
      setMedicaments(medData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRendezVous = async (rdvId: string) => {
    try {
      setError(null);
      await PatientApiService.cancelRendezVous(rdvId, user.token);
      await loadPatientData();
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', error);
      setError('Erreur lors de l\'annulation du rendez-vous. Veuillez réessayer.');
    }
  };

  const handleAddComment = async (rdvId: string) => {
    try {
      setError(null);
      const commentaire = comments[rdvId];
      if (!commentaire?.trim()) {
        setError('Le commentaire ne peut pas être vide.');
        return;
      }
      await PatientApiService.addCommentToRendezVous(rdvId, commentaire, user.token);
      setComments({ ...comments, [rdvId]: '' });
      await loadPatientData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      setError('Erreur lors de l\'ajout du commentaire. Veuillez réessayer.');
    }
  };

  const handleViewDetails = async (ordId: string) => {
    try {
      setError(null);
      if (!detailedOrdonnances[ordId]) {
        const data = await PatientApiService.getOrdonnanceById(ordId, user.token);
        setDetailedOrdonnances({ ...detailedOrdonnances, [ordId]: data });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'ordonnance:', error);
      setError('Erreur lors de la récupération des détails de l\'ordonnance. Veuillez réessayer.');
    }
  };

  const handleAddMedicament = async () => {
    try {
      setError(null);
      const data: CreateMedicamentDTO = {
        ...newMedicament,
        frequence: parseInt(String(newMedicament.frequence), 10),
   horaires: horairesInput
        .split(',')
        .map(h => h.trim())
        .filter(h => h), // clean values
    };
      
      // Basic validation
      if (!data.dateDebut || !data.dateFin || !data.nomCommercial || !data.dosage || !data.voieAdministration) {
        setError('Tous les champs obligatoires doivent être remplis.');
        return;
      }
      
      if (isNaN(data.frequence) || data.frequence <= 0) {
        setError('La fréquence doit être un nombre positif.');
        return;
      }

      await PatientApiService.addMedicament(data, user.token);
      setNewMedicament({
        dateDebut: '',
        dateFin: '',
        dosage: '',
        frequence: 1,
        nomCommercial: '',
        voieAdministration: '',
        horaires: [],
      });
      setHorairesInput(''); // reset input field
      setShowMedicamentForm(false); // Hide form after adding
      await loadPatientData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médicament:', error);
      setError('Erreur lors de l\'ajout du médicament. Veuillez réessayer.');
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'confirmé':
        return 'bg-green-100 text-green-800';
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'annulé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRdvDateTime = (rdv: RendezVous) => {
    return new Date(`${rdv.date}T${rdv.heure}:00`).getTime();
  };

  const prochainRdv = rendezVous
    .filter(rdv => getRdvDateTime(rdv) > Date.now() && rdv.statut !== 'Annulé')
    .sort((a, b) => getRdvDateTime(a) - getRdvDateTime(b))[0];

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 right-0 px-4 py-3"
          >
            <svg className="fill-current h-6 w-6 text-red-500" role="button" viewBox="0 0 20 20">
              <path d="M14.348 14.849a1 1 0 01-1.414 0L10 11.414l-2.934 2.935a1 1 0 01-1.414-1.414L8.586 10 5.652 7.065a1 1 0 011.414-1.414L10 8.586l2.934-2.935a1 1 0 011.414 1.414L11.414 10l2.934 2.935a1 1 0 010 1.414z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={onOpenProfile} className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center hover:bg-opacity-30 transition">
              <User className="w-8 h-8 text-white" />
            </button>
            <div>
              <h2 className="text-3xl font-bold">Bonjour, {user.prenom}</h2>
              <p className="text-xl opacity-90">{getTodayDate()}</p>
            </div>
          </div>
          <p className="text-lg opacity-75">
            Gérez vos rendez-vous et consultez votre dossier médical en toute simplicité.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rendez-vous</p>
              <p className="text-2xl font-bold text-gray-900">{rendezVous.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ordonnances</p>
              <p className="text-2xl font-bold text-gray-900">{ordonnances.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Pills className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Médicaments</p>
              <p className="text-2xl font-bold text-gray-900">{medicaments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Suivi médical</p>
              <p className="text-2xl font-bold text-gray-900">Actif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prochain Rendez-vous */}
      {prochainRdv && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Prochain rendez-vous
          </h3>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{prochainRdv.type}</p>
                <p className="text-sm text-gray-600">Dr. {prochainRdv.medecin}</p>
                <p className="text-sm text-gray-600">
                  {new Date(prochainRdv.date).toLocaleDateString('fr-FR')} à {prochainRdv.heure}
                </p>
                {prochainRdv.commentaire && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Note:</span> {prochainRdv.commentaire}
                  </p>
                )}
                {prochainRdv.statut !== 'Annulé' && prochainRdv.statut !== 'Terminé' && (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded border border-gray-300 p-2 text-sm"
                      value={comments[prochainRdv.id] ?? ''}
                      onChange={(e) => setComments({ ...comments, [prochainRdv.id]: e.target.value })}
                      placeholder="Ajouter un commentaire"
                    />
                    <button
                      onClick={() => handleAddComment(prochainRdv.id)}
                      className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => handleCancelRendezVous(prochainRdv.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prochainRdv.statut)}`}>
                {prochainRdv.statut}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('rdv')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'rdv'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Mes rendez-vous
            </button>
            <button
              onClick={() => setActiveTab('ordonnances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ordonnances'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Mes ordonnances
            </button>
            <button
              onClick={() => setActiveTab('medicaments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'medicaments'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Pills className="w-4 h-4 inline mr-2" />
              Mes médicaments
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'rdv' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : rendezVous.length > 0 ? (
                rendezVous.map((rdv) => (
                  <div key={rdv.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{rdv.type}</h4>
                        <p className="text-sm text-gray-600">Dr. {rdv.medecin}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(rdv.date).toLocaleDateString('fr-FR')} à {rdv.heure}
                        </p>
                        {rdv.commentaire && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Note:</span> {rdv.commentaire}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rdv.statut)}`}>
                          {rdv.statut}
                        </span>
                      </div>
                    </div>
                    {rdv.statut !== 'Annulé' && rdv.statut !== 'Terminé' && (
                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          className="flex-1 rounded border border-gray-300 p-2 text-sm"
                          value={comments[rdv.id] ?? ''}
                          onChange={(e) => setComments({ ...comments, [rdv.id]: e.target.value })}
                          placeholder="Ajouter un commentaire"
                        />
                        <button
                          onClick={() => handleAddComment(rdv.id)}
                          className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                        >
                          Ajouter
                        </button>
                        <button
                          onClick={() => handleCancelRendezVous(rdv.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun rendez-vous planifié</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ordonnances' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : ordonnances.length > 0 ? (
                ordonnances.map((ord) => (
                  <div key={ord.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Pills className="w-4 h-4 text-purple-600" />
                          <h4 className="font-medium text-gray-900">
                            {ord.traitementNom || `Ordonnance du ${ord.date}`}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Prescrite par Dr. {ord.medecin}</p>
                        <p className="text-sm text-gray-600 mb-2">Date: {ord.date}</p>
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">Médicaments:</p>
                          <ul className="list-disc list-inside mt-1">
                            {ord.medicaments.map((med, index) => (
                              <li key={index}>{med}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ord.statut)}`}>
                        {ord.statut}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(ord.id)}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Voir détails
                    </button>
                    {detailedOrdonnances[ord.id] && (
                      <div className="mt-4 border-t pt-4 text-sm text-gray-700">
                        <p className="font-medium mb-2">Détails complets des médicaments:</p>
                        <ul className="space-y-2">
                          {detailedOrdonnances[ord.id].traitement.medicaments.map((med, index) => (
                            <li key={index} className="bg-white p-2 rounded border">
                              <p><span className="font-medium">Nom:</span> {med.nomCommercial}</p>
                              <p><span className="font-medium">Dosage:</span> {med.dosage}</p>
                              <p><span className="font-medium">Fréquence:</span> {med.frequence} fois par jour</p>
                              <p><span className="font-medium">Voie:</span> {med.voieAdministration}</p>
                              <p><span className="font-medium">Horaires:</span> {med.horaires.join(', ')}</p>
                              <p><span className="font-medium">Début:</span> {new Date(med.dateDebut).toLocaleDateString('fr-FR')}</p>
                              <p><span className="font-medium">Fin:</span> {new Date(med.dateFin).toLocaleDateString('fr-FR')}</p>
                            </li>
                          ))}
                        </ul>
                        {detailedOrdonnances[ord.id].signatureElectronique && (
                          <p className="mt-2"><span className="font-medium">Signature électronique:</span> {detailedOrdonnances[ord.id].signatureElectronique}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucune ordonnance disponible</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'medicaments' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setShowMedicamentForm(!showMedicamentForm)}
                      className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                    >
                      {showMedicamentForm ? 'Masquer le formulaire' : 'Ajouter un nouveau médicament'}
                    </button>
                    {showMedicamentForm && (
                      <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un nouveau médicament</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date de début</label>
                            <input
                              type="date"
                              value={newMedicament.dateDebut}
                              onChange={(e) => setNewMedicament({ ...newMedicament, dateDebut: e.target.value })}
                              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                            <input
                              type="date"
                              value={newMedicament.dateFin}
                              onChange={(e) => setNewMedicament({ ...newMedicament, dateFin: e.target.value })}
                              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Dosage</label>
                            <input
                              type="text"
                              placeholder="ex: 500mg"
                              value={newMedicament.dosage}
                              onChange={(e) => setNewMedicament({ ...newMedicament, dosage: e.target.value })}
                              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm"
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
                              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nom commercial</label>
                            <input
                              type="text"
                              placeholder="ex: Paracétamol"
                              value={newMedicament.nomCommercial}
                              onChange={(e) => setNewMedicament({ ...newMedicament, nomCommercial: e.target.value })}
                              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Voie d'administration</label>
                            <select
                              value={newMedicament.voieAdministration}
                              onChange={(e) => setNewMedicament({ ...newMedicament, voieAdministration: e.target.value })}
                              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm"
                              required
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Orale">Orale</option>
                              <option value="Intraveineuse">Intraveineuse</option>
                              <option value="Topique">Topique</option>
                              <option value="Inhalation">Inhalation</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Horaires (séparés par virgule)</label>
                           <input
                            type="text"
                            placeholder="ex: 08:00, 12:00, 20:00"
                            value={horairesInput}
                            onChange={(e) => setHorairesInput(e.target.value)}
                            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm"
                          />

                          </div>
                        </div>
                        <button
                          onClick={handleAddMedicament}
                          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                        >
                          Ajouter le médicament
                        </button>
                      </div>
                    )}
                  </div>
                  {medicaments.length > 0 ? (
                    medicaments.map((med) => (
                      <div key={med.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Pills className="w-4 h-4 text-green-600" />
                              <h4 className="font-medium text-gray-900">{med.nomCommercial}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><span className="font-medium">Dosage:</span> {med.dosage}</p>
                                <p><span className="font-medium">Fréquence:</span> {med.frequence}x/jour</p>
                                <p><span className="font-medium">Voie:</span> {med.voieAdministration}</p>
                              </div>
                              <div>
                                <p><span className="font-medium">Début:</span> {med.dateDebut}</p>
                                <p><span className="font-medium">Fin:</span> {med.dateFin}</p>
                                {med.horaires.length > 0 && (
                                  <p><span className="font-medium">Horaires:</span> {med.horaires.join(', ')}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Pills className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Aucun médicament en cours</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}