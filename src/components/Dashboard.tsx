import React, { useState, useEffect, Component, ReactNode } from 'react';
import { LogOut, User, Stethoscope, Calendar, FileText, Users, ChevronDown, Bell, Heart, UserPlus, Clock, Pill as Pills, Activity, Search, Edit, Phone, Mail, MapPin, ChevronRight, Clipboard, Trash2  } from 'lucide-react';import NotificationPanel from './notifications/NotificationPanel';
import EquipeManagement from './equipe/EquipeManagement';
import RdvManagement from './rdv/RdvManagement';
import PatientRegistration from './secretary/PatientRegistration';
import AppointmentScheduler from './secretary/AppointmentScheduler';
import { RendezVous, Ordonnance, Medicament, CreateMedicamentDTO } from '../types/patient';
import { OrdonnanceApiService } from '../service/ordonnanceApi';
import { RdvApiService } from '../service/rdvApi';
import { SecretaryApiService } from '../service/SecretaryApiService';
import { PatientApiService } from '../service/PatientApiService';
import OrdonnanceManagement from './ordonannance/OrdonnanceManagement';
import { NotificationApiService } from '../service/notificationsApi';
import TraitementManagement from './treatments/TraitementManagement';
import { TraitementApiService } from '../service/TraitementApiService';

interface DashboardProps {
  user: { token: string; role: string; prenom: string; id: string; nbrPatients?: number };
  onLogout: () => void;
  onOpenProfile: () => void;
}

interface Patient {
  numero: string;
  id: string;
  nom: string;
  prenom: string;
  email: string;
  dateNaissance: string;
  adresse: string;
  dateInscription?: string;
}

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Une erreur s'est produite</h1>
            <p className="text-gray-600 mt-2">Veuillez recharger la page ou contacter le support.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Dashboard({ user, onLogout, onOpenProfile }: DashboardProps) {
  console.log('Dashboard component rendered, role:', user.role);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEquipeManagement, setShowEquipeManagement] = useState(false);
  const [showRdvManagement, setShowRdvManagement] = useState(false);
  const [showOrdonnanceManagement, setShowOrdonnanceManagement] = useState(false);
  const [showPatientRegistration, setShowPatientRegistration] = useState(false);
  const [showAppointmentScheduler, setShowAppointmentScheduler] = useState(false);
  const [showTraitementManagement, setShowTraitementManagement] = useState(false);
  const [traitementCount, setTraitementCount] = useState(0);

  // Medecin specific states
  const [ordonnanceCount, setOrdonnanceCount] = useState(0);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  const [showMedicamentForm, setShowMedicamentForm] = useState(false);
  // Secretary specific states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [secretaryRendezVous, setSecretaryRendezVous] = useState<RendezVous[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('patients');

  // Patient specific states
  const [patientRendezVous, setPatientRendezVous] = useState<RendezVous[]>([]);
  const [patientOrdonnances, setPatientOrdonnances] = useState<Ordonnance[]>([]);
  const [patientMedicaments, setPatientMedicaments] = useState<Medicament[]>([]);
  const [patientActiveTab, setPatientActiveTab] = useState('rdv');
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingRdvId, setEditingRdvId] = useState<string | null>(null);
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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoadingNotifications(true);
        setNotificationError(null);
        const fetchedNotifications = await NotificationApiService.getNotifications(user.token);
        setNotifications(fetchedNotifications);
      } catch (error: any) {
        console.error('Erreur lors du chargement des notifications:', error);
        setNotificationError(error.message);
      } finally {
        setLoadingNotifications(false);
      }
    };

    if (user.role === 'Patient') {
      loadNotifications();
      loadPatientData();
    } else if (user.role === 'Medecin') {
      loadOrdonnanceCount();
      loadTodayAppointmentsCount();
      loadNotifications(); // Fetch notifications for Medecin role if needed
      loadTraitementCount();
    } else if (user.role === 'Secretaire') {
      loadSecretaryData();
      loadNotifications(); // Fetch notifications for Secretaire role if needed
    }
  }, [user.role, user.token, user.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationApiService.markAsRead(id, user.token);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, lu: true } : notif))
      );
    } catch (error: any) {
      console.error('Erreur lors du marquage comme lu:', error);
      setNotificationError(error.message);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((notif) => !notif.lu);
      await Promise.all(
        unreadNotifications.map((notif) => NotificationApiService.markAsRead(notif.id, user.token))
      );
      setNotifications((prev) => prev.map((notif) => ({ ...notif, lu: true })));
    } catch (error: any) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      setNotificationError(error.message);
    }
  };

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user.role === 'Medecin') {
      loadOrdonnanceCount();
      loadTodayAppointmentsCount();
    } else if (user.role === 'Secretaire') {
      loadSecretaryData();
    } else if (user.role === 'Patient') {
      loadPatientData();
    }
  }, [user.role]);

  const loadOrdonnanceCount = async () => {
    try {
      const ordonnances = await OrdonnanceApiService.getOrdonnancesByMedecin(user.token);
      setOrdonnanceCount(ordonnances.length);
    } catch (error: any) {
      console.error('Error fetching ordonnance count:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setOrdonnanceCount(0);
    }
  };

  const loadTraitementCount = async () => {
    try {
      const traitements = await TraitementApiService.getAllTraitements(user.token);
      setTraitementCount(traitements.length);
    } catch (error: any) {
      console.error('Error fetching traitement count:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setTraitementCount(0);
    }
  };

  const loadTodayAppointmentsCount = async () => {
    try {
      const appointments = await RdvApiService.getRendezVousAujourdhui(user.token);
      setTodayAppointmentsCount(appointments.length);
    } catch (error: any) {
      console.error('Error fetching today appointments count:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setTodayAppointmentsCount(0);
    }
  };

  const loadSecretaryData = async () => {
    console.log('Starting loadSecretaryData, Token:', user.token); // TODO: Remove token logging in production
    try {
      setLoading(true);
      const [patientsData, rdvData] = await Promise.all([
        SecretaryApiService.getPatientsBySecretaire(user.token),
        SecretaryApiService.getRendezVous(user.token),
      ]);
      console.log('Fetched Patients Data:', patientsData);
      console.log('Fetched Rendez-vous Data:', rdvData);
      setPatients(patientsData);
      // Ensure rdvData.rendezVous is an array before setting
      setSecretaryRendezVous(Array.isArray(rdvData.rendezVous) ? rdvData.rendezVous : []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des données secrétaire:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
      console.log('loadSecretaryData completed');
    }
  };

  // Added loadAppointments function to refresh rendez-vous
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const rdvData = await SecretaryApiService.getRendezVous(user.token);
      setSecretaryRendezVous(Array.isArray(rdvData.rendezVous) ? rdvData.rendezVous : []);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      setError('Erreur lors du chargement des rendez-vous. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rdvData, ordData, medData] = await Promise.all([
        PatientApiService.getRendezVous(user.token, user.id),
        PatientApiService.getOrdonnances(user.token, user.id),
        PatientApiService.getMedicaments(user.token),
      ]);
      setPatientRendezVous(rdvData);
      setPatientOrdonnances(ordData);
      setPatientMedicaments(medData);
    } catch (error: any) {
      console.error('Erreur lors du chargement des données patient:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
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

  const handleAddMedicament = async () => {
    try {
      setError(null);
      const data: CreateMedicamentDTO = {
        ...newMedicament,
        frequence: parseInt(String(newMedicament.frequence), 10),
        horaires: newMedicament.horaires.join(',').split(',').map(h => h.trim()).filter(h => h),
      };

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
      setShowMedicamentForm(false); // Hide form after adding
      await loadPatientData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médicament:', error);
      setError('Erreur lors de l\'ajout du médicament. Veuillez réessayer.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    onLogout();
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'Medecin':
        return <Stethoscope className="w-8 h-8 text-white" />;
      case 'Secretaire':
        return <Users className="w-8 h-8 text-white" />;
      case 'Patient':
        return <User className="w-8 h-8 text-white" />;
      default:
        return <User className="w-8 h-8 text-white" />;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'Medecin':
        return 'from-blue-600 to-blue-700';
      case 'Secretaire':
        return 'from-green-600 to-green-700';
      case 'Patient':
        return 'from-purple-600 to-purple-700';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getMedecinModules = () => [
    {
      icon: Users,
      title: 'Équipe',
      description: 'Gérer vos secrétaires',
      color: 'from-blue-500 to-blue-600',
      onClick: () => setShowEquipeManagement(true),
    },
    {
      icon: Calendar,
      title: 'Rendez-vous',
      description: 'Consultations du jour',
      color: 'from-green-500 to-green-600',
      onClick: () => setShowRdvManagement(true),
    },
    {
      icon: FileText,
      title: 'Ordonnances',
      description: 'Gérer les ordonnances',
      color: 'from-purple-500 to-purple-600',
      onClick: () => setShowOrdonnanceManagement(true),
    },
    {
      icon: Clipboard,
      title: 'Traitements',
      description: 'Gérer les traitements patients',
      color: 'from-orange-500 to-orange-600',
      onClick: () => setShowTraitementManagement(true),
    },
  ];

  const getSecretaryModules = () => [
    {
      icon: UserPlus,
      title: 'Nouveau patient',
      description: 'Enregistrer un nouveau patient',
      color: 'from-blue-500 to-blue-600',
      onClick: () => {
        setEditingPatientId(null); // Reset to create mode
        setShowPatientRegistration(true);
      },
    },
    {
      icon: Calendar,
      title: 'Planifier RDV',
      description: 'Programmer un rendez-vous',
      color: 'from-green-500 to-green-600',
      onClick: () => setShowAppointmentScheduler(true),
    },
  ];

  const getTodayDate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const getRdvDateTime = (rdv: RendezVous) => {
    return new Date(`${rdv.date}T${rdv.heure}:00`).getTime();
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.prenom} ${patient.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.numero && patient.numero.includes(searchTerm))
  );

  const todayAppointments = Array.isArray(secretaryRendezVous)
    ? secretaryRendezVous.filter(rdv => {
      const today = new Date().toDateString();
      return new Date(rdv.date).toDateString();
    })
    : [];

  const prochainRdv = patientRendezVous
    .filter(rdv => getRdvDateTime(rdv) > Date.now() && rdv.statut !== 'Annulé')
    .sort((a, b) => getRdvDateTime(a) - getRdvDateTime(b))[0];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">MedicalAssist</h1>
                  <p className="text-xs text-gray-500">Gestion médicale</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationPanel
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onClearAll={handleClearAllNotifications}
                />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${getRoleColor()} rounded-full flex items-center justify-center`}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.role}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          onOpenProfile();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profil
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => setError(null)}
                className="absolute top-0 right-0 px-4 py-3"
              >
                <svg className="fill-current h-6 w-6 text-red-500" role="button" viewBox="0 0 20 20">
                  <path d="M14.348 14.849a1 1 0 01-1.414 0L10 11.414l-2.934 2.935a1 1 0 01-1.414-1.414L8.586 10 5.652 7.065a1 1 0 011.414-1.414L10 8.586l2.934-2.935a1 1 0 011.414 1.414L11.414 10l2.934 2.935a1 1 0 010 1.414z" />
                </svg>
              </button>
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-8">
            <div className={`bg-gradient-to-r ${getRoleColor()} rounded-2xl p-8 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    {getRoleIcon()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">
                      {user.role === 'Medecin' ? `Bienvenue, Dr. ${user.prenom}` :
                        user.role === 'Secretaire' ? `Bonjour, ${user.prenom}` :
                          `Bonjour, ${user.prenom}`}
                    </h2>
                    <p className="text-xl opacity-90">{getTodayDate()}</p>
                  </div>
                </div>
                <p className="text-lg opacity-75">
                  {user.role === 'Medecin' && 'Gérez vos consultations et votre équipe médicale.'}
                  {user.role === 'Secretaire' && 'Organisez les rendez-vous et gérez l\'administration des patients.'}
                  {user.role === 'Patient' && 'Gérez vos rendez-vous et consultez votre dossier médical en toute simplicité.'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section - Medecin */}
          {user.role === 'Medecin' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rendez-vous d'aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-900">{todayAppointmentsCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{user.nbrPatients || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ordonnances</p>
                    <p className="text-2xl font-bold text-gray-900">{ordonnanceCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clipboard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Traitements</p>
                    <p className="text-2xl font-bold text-gray-900">{traitementCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Section - Secretaire */}
          {user.role === 'Secretaire' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">RDV</p>
                    <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(secretaryRendezVous) ? secretaryRendezVous.filter(rdv => rdv.statut === 'en attente').length : 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Notifications</p>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Section - Patient */}
          {user.role === 'Patient' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rendez-vous</p>
                    <p className="text-2xl font-bold text-gray-900">{patientRendezVous.length}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{patientOrdonnances.length}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{patientMedicaments.length}</p>
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
          )}

          {/* Modules Section - Medecin */}
          {user.role === 'Medecin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getMedecinModules().map((module, index) => (
                <div
                  key={index}
                  onClick={module.onClick}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${module.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <module.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{module.title}</h3>
                  <p className="text-gray-600 text-lg">{module.description}</p>
                  <div className="mt-6 flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                    <span className="font-medium">Accéder</span>
                    <ChevronDown className="w-4 h-4 ml-2 transform -rotate-90 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modules Section - Secretaire */}
          {user.role === 'Secretaire' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {getSecretaryModules().map((module, index) => (
                  <div
                    key={index}
                    onClick={module.onClick}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${module.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <module.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{module.title}</h3>
                    <p className="text-gray-600 text-lg">{module.description}</p>
                    <div className="mt-6 flex items-center text-green-600 group-hover:text-green-700 transition-colors">
                      <span className="font-medium">Commencer</span>
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Secretary Content Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('patients')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'patients'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Patients ({patients.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('rdv')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'rdv'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Rendez-vous ({todayAppointments.length})
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === 'patients' && (
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un patient..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Patients List */}
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2">Chargement...</p>
                        </div>
                      ) : filteredPatients.length > 0 ? (
                        <div className="space-y-3">
                          {filteredPatients.map((patient) => (
                            <div key={patient.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">
                                    {patient.prenom} {patient.nom}
                                  </h4>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Mail className="w-4 h-4" />
                                      {patient.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="w-4 h-4" />
                                      {patient.numero || 'Non fourni'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      {patient.adresse || 'Non fourni'}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingPatientId(patient.id);
                                    setShowPatientRegistration(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">
                            {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'rdv' && (
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2">Chargement...</p>
                        </div>
                      ) : todayAppointments.length > 0 ? (
                        <>
                          {todayAppointments
                            .sort((a, b) => {
                              const today = new Date().toDateString();
                              const dateA = a.date;
                              const dateB = b.date;
                              if (dateA === today && dateB !== today) return -1;
                              if (dateB === today && dateA !== today) return 1;
                              if (dateA === dateB) {
                                return new Date(`${dateA} ${a.heure}`).getTime() - new Date(`${dateB} ${b.heure}`).getTime();
                              }
                              return new Date(dateA).getTime() - new Date(dateB).getTime();
                            })
                            .reduce((acc, rdv, index, array) => {
                              const isToday = rdv.date === '2025-09-01'; // Replace with dynamic date if needed
                              const prevRdv = array[index - 1];
                              const showTodayHeader = isToday && (!prevRdv || prevRdv.date !== rdv.date);
                              const showOtherHeader = !isToday && (!prevRdv || prevRdv.date === '2025-09-01');

                              return [
                                ...acc,
                                ...(showTodayHeader ? [
                                  <h3 key="today-header" className="text-lg font-semibold text-gray-900 mt-6 mb-2">
                                    Rendez-vous d'aujourd'hui
                                  </h3>
                                ] : []),
                                ...(showOtherHeader ? [
                                  <h3 key="other-header" className="text-lg font-semibold text-gray-900 mt-6 mb-2">
                                    Autres rendez-vous
                                  </h3>
                                ] : []),
                                <div key={rdv.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium text-gray-900">
                                        {rdv.patientPrenom} {rdv.patientNom}
                                      </h4>
                                      <p className="text-sm text-gray-600">Dr. {rdv.medecin}</p>
                                      <p className="text-sm text-gray-600">{rdv.date} - {rdv.heure}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rdv.statut)}`}>
                                        {rdv.statut}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setEditingRdvId(rdv.id);
                                          setShowAppointmentScheduler(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (window.confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) {
                                            try {
                                              setLoading(true);
                                              setError(null);
                                              await SecretaryApiService.deleteRendezVous(user.token, rdv.id);
                                              await loadAppointments();
                                            } catch (error: any) {
                                              console.error('Erreur lors de la suppression du rendez-vous:', error);
                                              setError(error.response?.data?.message || 'Erreur lors de la suppression du rendez-vous');
                                            } finally {
                                              setLoading(false);
                                            }
                                          }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                      {rdv.statut !== 'annulé' && (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            className="rounded border border-gray-300 p-2 text-sm w-32"
                                            placeholder="Raison d'annulation"
                                            value={comments[rdv.id] ?? ''}
                                            onChange={(e) => setComments({ ...comments, [rdv.id]: e.target.value })}
                                          />
                                          <button
                                            onClick={() => handleCancelRendezVous(rdv.id)}
                                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                                          >
                                            Annuler
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ];
                            }, [] as JSX.Element[])}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">Aucun rendez-vous</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Patient Dashboard Content */}
          {user.role === 'Patient' && (
            <>
              {/* Prochain Rendez-vous */}
              {prochainRdv && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Prochain rendez-vous
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{prochainRdv.type}</p>
                        <p className="text-sm text-gray-600">{prochainRdv.medecin}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(prochainRdv.date).toLocaleDateString('fr-FR')} à {prochainRdv.heure}
                        </p>
                        {prochainRdv.commentaire && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Note:</span> {prochainRdv.commentaire}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prochainRdv.statut)}`}>
                          {prochainRdv.statut}
                        </span>
                        {prochainRdv.statut !== 'Annulé' && prochainRdv.statut !== 'Terminé' && (
                          <button
                            onClick={() => handleCancelRendezVous(prochainRdv.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
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
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setPatientActiveTab('rdv')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${patientActiveTab === 'rdv'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Mes rendez-vous
                    </button>
                    <button
                      onClick={() => setPatientActiveTab('ordonnances')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${patientActiveTab === 'ordonnances'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <FileText className="w-4 h-4 inline mr-2" />
                      Mes ordonnances
                    </button>
                    <button
                      onClick={() => setPatientActiveTab('medicaments')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${patientActiveTab === 'medicaments'
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
                  {patientActiveTab === 'rdv' && (
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2">Chargement...</p>
                        </div>
                      ) : patientRendezVous.length > 0 ? (
                        patientRendezVous.map((rdv) => (
                          <div key={rdv.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{rdv.type}</h4>
                                <p className="text-sm text-gray-600">{rdv.medecin}</p>
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
                                {rdv.statut !== 'Annulé' && rdv.statut !== 'Terminé' && (
                                  <button
                                    onClick={() => handleCancelRendezVous(rdv.id)}
                                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                                  >
                                    Annuler
                                  </button>
                                )}
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

                  {patientActiveTab === 'ordonnances' && (
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2">Chargement...</p>
                        </div>
                      ) : patientOrdonnances.length > 0 ? (
                        patientOrdonnances.map((ord) => (
                          <div key={ord.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Pills className="w-4 h-4 text-purple-600" />
                                  <h4 className="font-medium text-gray-900">
                                    {ord.traitementNom || `Ordonnance du ${new Date(ord.date).toLocaleDateString('fr-FR')}`}
                                  </h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Prescrite par {ord.medecin}</p>
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

                  {patientActiveTab === 'medicaments' && (
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
                                      value={newMedicament.horaires.join(', ')}
                                      onChange={(e) => setNewMedicament({ ...newMedicament, horaires: e.target.value.split(',').map(h => h.trim()).filter(h => h) })}
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
                          {patientMedicaments.length > 0 ? (
                            patientMedicaments.map((med) => (
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
            </>
          )}

          {/* Modals - Medecin */}
          {showEquipeManagement && (
            <EquipeManagement token={user.token} onClose={() => setShowEquipeManagement(false)} />
          )}
          {showRdvManagement && (
            <RdvManagement token={user.token} onClose={() => setShowRdvManagement(false)} />
          )}
          {showOrdonnanceManagement && (
            <OrdonnanceManagement
              token={user.token}
              medecinId={user.id}
              onClose={() => setShowOrdonnanceManagement(false)}
            />
          )}

          {showTraitementManagement && (
            <TraitementManagement
              token={user.token}
              onClose={() => setShowTraitementManagement(false)}
            />
          )}

          {/* Modals - Secretary */}
          {showPatientRegistration && (
            <PatientRegistration
              token={user.token}
              onClose={() => {
                setShowPatientRegistration(false);
                setEditingPatientId(null); // Reset edit state
                setEditingRdvId(null);
              }}
              onSuccess={() => {
                setShowPatientRegistration(false);
                setEditingRdvId(null);
                setEditingPatientId(null); // Reset edit state
                loadSecretaryData();
              }}
              patientId={editingPatientId} // Pass the patient ID for editing
            />
          )}

          {showAppointmentScheduler && (
            <AppointmentScheduler
              token={user.token}
              patients={patients}
              onClose={() => {
                setShowAppointmentScheduler(false);
                setEditingRdvId(null);
              }}
              onSuccess={() => {
                setShowAppointmentScheduler(false);
                setEditingRdvId(null);
                loadAppointments();
              }}
              rdvId={editingRdvId}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}