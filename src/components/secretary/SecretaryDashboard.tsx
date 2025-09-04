// components/SecretaryDashboard.js (updated component)
import React, { useState, useEffect } from 'react';
import { UserPlus, Calendar, Users, Bell, Search, Edit, Phone, Mail, MapPin, ChevronRight, Clock } from 'lucide-react';
import { SecretaryApiService } from '../../service/SecretaryApiService';
import PatientRegistration from './PatientRegistration';
import AppointmentScheduler from './AppointmentScheduler';
import { parseISO, isSameDay } from 'date-fns';

interface SecretaryDashboardProps {
  user: { token: string; prenom: string; id: string };
  onOpenProfile: () => void;
}

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  dateNaissance: string;
  adresse: string;
  dateInscription: string;
}

interface RendezVous {
  id: string;
  patientNom: string;
  patientPrenom: string;
  date: string;
  heure: string;
  type: string;
  statut: string;
  medecin: string;
  medecinId: string;
}

export default function SecretaryDashboard({ user, onOpenProfile }: SecretaryDashboardProps) {
  console.log('SecretaryDashboard component rendered');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [showPatientRegistration, setShowPatientRegistration] = useState(false);
  const [showAppointmentScheduler, setShowAppointmentScheduler] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patients'); // Changed to 'patients' for patient list focus

  useEffect(() => {
    console.log('useEffect triggered for loadSecretaryData');
    loadSecretaryData();
  }, []);

const loadSecretaryData = async () => {
  try {
    setLoading(true);
    const [patientsData, rdvData] = await Promise.all([
      SecretaryApiService.getPatientsBySecretaire(user.token),
      SecretaryApiService.getRendezVous(user.token),
    ]);
    console.log('Fetched Patients Data:', patientsData);
    console.log('Fetched Rendez-vous Data:', rdvData);
    setPatients(patientsData);
    setSecretaryRendezVous(rdvData); // Fixed: Changed setRendezVous to setSecretaryRendezVous
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const todayAppointments = rendezVous.filter((rdv) => {
      const rdvDate = parseISO(rdv.date);
      const today = new Date();
      const isToday = isSameDay(rdvDate, today);
      console.log('Rendez-vous:', rdv, 'Is Today:', isToday);
      return isToday;
    });
    console.log('All Appointments:', rendezVous);
    console.log('Today Appointments:', todayAppointments);
  }, [rendezVous]);

  const getTodayDate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupAppointmentsByMedecin = (appointments: RendezVous[]) => {
    const grouped: { [key: string]: { medecin: string; appointments: RendezVous[] } } = {};
    appointments.forEach((rdv) => {
      const key = rdv.medecinId;
      if (!grouped[key]) {
        grouped[key] = {
          medecin: rdv.medecin,
          appointments: [],
        };
      }
      grouped[key].appointments.push(rdv);
    });
    return Object.values(grouped);
  };

  const todayAppointments = rendezVous.filter((rdv) => {
    const rdvDate = parseISO(rdv.date);
    const today = new Date();
    return isSameDay(rdvDate, today);
  });

  const groupedAppointments = groupAppointmentsByMedecin(todayAppointments);

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

  const filteredPatients = patients.filter((patient) =>
    `${patient.nom} ${patient.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Bonjour, {user.prenom}</h2>
                <p className="text-xl opacity-90">{getTodayDate()}</p>
              </div>
            </div>
            <p className="text-lg opacity-75">
              Organisez les rendez-vous et gérez l'administration des patients.
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
                <p className="text-sm text-gray-600">RDV aujourd'hui</p>
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
                  {rendezVous.filter((rdv) => rdv.statut === 'en attente').length}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => setShowPatientRegistration(true)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Nouveau patient</h3>
            <p className="text-gray-600 text-lg">Enregistrer un nouveau patient dans le système</p>
            <div className="mt-6 flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
              <span className="font-medium">Commencer</span>
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => setShowAppointmentScheduler(true)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Planifier RDV</h3>
            <p className="text-gray-600 text-lg">Programmer un nouveau rendez-vous</p>
            <div className="mt-6 flex items-center text-green-600 group-hover:text-green-700 transition-colors">
              <span className="font-medium">Planifier</span>
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Content Tabs */}
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
                Rendez-vous du jour ({todayAppointments.length})
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
                                {patient.numero}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                {patient.adresse}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                Inscription: {patient.dateInscription}
                              </div>
                            </div>
                          </div>
                          <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
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
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Chargement...</p>
                  </div>
                ) : groupedAppointments.length > 0 ? (
                  groupedAppointments.map((group) => (
                    <div key={group.medecin} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Dr. {group.medecin}</h3>
                      <div className="space-y-3">
                        {group.appointments.map((rdv) => (
                          <div
                            key={rdv.id}
                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {rdv.patientPrenom} {rdv.patientNom}
                                </h4>
                                <p className="text-sm text-gray-600">{rdv.heure} - {rdv.type}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  rdv.statut
                                )}`}
                              >
                                {rdv.statut}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucun rendez-vous aujourd'hui</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPatientRegistration && (
        <PatientRegistration
          token={user.token}
          onClose={() => setShowPatientRegistration(false)}
          onSuccess={() => {
            setShowPatientRegistration(false);
            loadSecretaryData();
          }}
        />
      )}

      {showAppointmentScheduler && (
        <AppointmentScheduler
          token={user.token}
          patients={patients}
          onClose={() => setShowAppointmentScheduler(false)}
          onSuccess={() => {
            setShowAppointmentScheduler(false);
            loadSecretaryData();
          }}
        />
      )}
    </>
  );
}