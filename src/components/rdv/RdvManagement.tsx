import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, X, AlertCircle, Search } from 'lucide-react';
import { RendezVous } from '../../types/medecin';
import { RdvApiService } from '../../service/rdvApi';

interface RdvManagementProps {
  token: string;
  onClose: () => void;
}

export default function RdvManagement({ token, onClose }: RdvManagementProps) {
  const [rdvAujourdhui, setRdvAujourdhui] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadRdvAujourdhui();
  }, []);

  const loadRdvAujourdhui = async () => {
    try {
      setIsLoading(true);
      const data = await RdvApiService.getRendezVousAujourdhui(token);
      setRdvAujourdhui(data);
    } catch (error) {
      console.error('Error loading rendez-vous:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsulter = async (rdvId: string) => {
    try {
      await RdvApiService.consulterRendezVous(token, rdvId);
      loadRdvAujourdhui(); // Refresh the list
    } catch (error) {
      console.error('Error marking appointment as consulted:', error);
    }
  };

  const getStatusColor = (statut: RendezVous['statut']) => {
    switch (statut) {
      case 'confirme':
        return 'bg-blue-100 text-blue-800';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'consulté':
        return 'bg-green-100 text-green-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: RendezVous['statut']) => {
    switch (statut) {
      case 'confirme':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'en_attente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'consulté':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'annule':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTime = (date: string, heure: string) => {
    const dateHeure = new Date(`${date}T${heure}`);
    return dateHeure.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredRdv = rdvAujourdhui.filter(rdv => {
    const matchesSearch = (rdv.patientId.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                         (rdv.patientId.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
                         // Removed motif since it's not in the API response
    const matchesStatus = selectedStatus === 'all' || rdv.statut === selectedStatus;
    return matchesSearch && matchesStatus;
  });
console.log(rdvAujourdhui);
  const todayStats = {
    total: rdvAujourdhui.length,
    
    termine: rdvAujourdhui.filter(rdv => rdv.statut === 'consulté').length,
    enAttente: rdvAujourdhui.filter(rdv => rdv.statut === 'en_attente').length,
    confirme: rdvAujourdhui.filter(rdv => rdv.statut === 'confirme').length,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Rendez-vous d'Aujourd'hui</h2>
                <p className="text-green-100">
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
              className="p-2 hover:bg-green-600 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-1">{todayStats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Terminés</span>
              </div>
              <p className="text-2xl font-bold text-green-700 mt-1">{todayStats.termine}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Confirmés</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-1">{todayStats.confirme}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">En attente</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{todayStats.enAttente}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirme">Confirmé</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          {/* Appointments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : filteredRdv.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Aucun rendez-vous trouvé</p>
              </div>
            ) : (
              filteredRdv.map((rdv) => (
                <div
                  key={rdv._id} // Changed from id to _id
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {rdv.patientId.prenom} {rdv.patientId.nom}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(rdv.statut)}`}>
                            {getStatusIcon(rdv.statut)}
                            {rdv.statut.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(rdv.date, rdv.heure)}</span>
                          </div>
                          {rdv.patientId.numero && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{rdv.patientId.numero}</span>
                            </div>
                          )}
                          {/* Removed motif and notes since they are not in the API response */}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rdv.statut !== 'consulté' && rdv.statut !== 'annule' && (
                        <button
                          onClick={() => handleConsulter(rdv._id)} // Changed from id to _id
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Consulter
                        </button>
                      )}
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