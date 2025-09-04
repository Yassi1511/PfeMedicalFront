import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Save, Trash2, AlertCircle } from 'lucide-react';
import { userService, UserProfile, UpdateProfileData } from '../../service/userService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onProfileDeleted: () => void;
}

export default function ProfileModal({ isOpen, onClose, token, onProfileDeleted }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdateProfileData>({});

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profileData = await userService.getProfile(token);
      console.log('Fetched profile:', profileData); // Debug log
      setProfile(profileData);
      setEditData({
        nom: profileData.nom,
        prenom: profileData.prenom,
        email: profileData.email,
        numero: profileData.numero,
      });
    } catch (error) {
      setError('Erreur lors du chargement du profil');
      console.error('Profile fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEditData = (): boolean => {
    if (!editData.nom?.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!editData.prenom?.trim()) {
      setError('Le prénom est requis');
      return false;
    }
    if (!editData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      setError('Un email valide est requis');
      return false;
    }
    if (editData.numero && !/^\+?[1-9]\d{1,14}$/.test(editData.numero)) {
      setError('Le numéro de téléphone est invalide');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!validateEditData()) {
      setIsSaving(false);
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      const updatedProfile = await userService.updateProfile(token, editData);
      console.log('Profile updated:', updatedProfile); // Debug log
      setProfile(updatedProfile);
      setIsEditing(false);
      // Explicitly avoid calling onClose to keep modal open
    } catch (error) {
      setError('Erreur lors de la mise à jour du profil');
      console.error('Profile update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await userService.deleteProfile(token);
      onProfileDeleted();
      onClose();
    } catch (error) {
      setError('Erreur lors de la suppression du profil');
      console.error('Profile delete error:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleInputChange = (field: keyof UpdateProfileData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6" />
            Mon Profil
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.nom || ''}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-white rounded-lg border border-gray-200">{profile.nom}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.prenom || ''}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-white rounded-lg border border-gray-200">{profile.prenom}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {profile.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.numero || ''}
                        onChange={(e) => handleInputChange('numero', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {profile.numero}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <p className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-500">
                    {profile.role} (non modifiable)
                  </p>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Créé le</label>
                    <p className="px-3 py-2 bg-white rounded-lg border border-gray-200">
                      {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dernière modification</label>
                    <p className="px-3 py-2 bg-white rounded-lg border border-gray-200">
                      {new Date(profile.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                {isEditing ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          nom: profile.nom,
                          prenom: profile.prenom,
                          email: profile.email,
                          numero: profile.numero,
                        });
                      }}
                      disabled={isSaving}
                      className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}

                <button
                  onClick={handleOpenDeleteModal}
                  disabled={isDeleting || isEditing}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Suppression...' : 'Supprimer le compte'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Deletion Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Confirmer la suppression
                </h3>
                <button
                  onClick={handleCloseDeleteModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer votre profil ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Suppression...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}