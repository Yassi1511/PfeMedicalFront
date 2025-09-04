import { useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle, Calendar } from 'lucide-react';
import { Notification } from '../../types/medecin';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onClearAll,
  loading,
  error,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.lu).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'rappel':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'rendezvous':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'rappel':
        return 'bg-blue-50 border-blue-200';
      case 'rendezvous':
        return 'bg-green-50 border-green-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p>Chargement...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                <p>{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors cursor-pointer ${
                      notification.lu ? 'bg-white' : 'bg-blue-50'
                    } ${getNotificationBg(notification.type)} hover:bg-gray-50`}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.lu ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.type === 'rappel' && notification.medicament
                                ? `${notification.medicament.nomCommercial} (${notification.medicament.dosage})`
                                : notification.type === 'rendezvous' && notification.rendezVous
                                ? `Rendez-vous le ${notification.rendezVous.date} à ${notification.rendezVous.heure}`
                                : notification.contenu}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{notification.contenu}</p>
                            {notification.horaire && (
                              <p className="text-xs text-gray-500 mt-1">À prendre à {notification.horaire}</p>
                            )}
                          </div>
                          {!notification.lu && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimestamp(notification.dateEnvoi)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}