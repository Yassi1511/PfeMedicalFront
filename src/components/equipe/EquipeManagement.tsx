import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit3, Search, Mail, Phone, User, X, Check } from 'lucide-react';
import { Secretaire, LierSecretaireDto, UpdateSecretaireDto } from '../../types/medecin';
import { MedecinApiService } from '../../service/medecinApi';

interface EquipeManagementProps {
  token: string;
  onClose: () => void;
}

export default function EquipeManagement({ token, onClose }: EquipeManagementProps) {
  const [secretaires, setSecretaires] = useState<Secretaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSecretaire, setEditingSecretaire] = useState<Secretaire | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    numero: '',
  });

  useEffect(() => {
    loadSecretaires();
  }, []);

  const loadSecretaires = async () => {
    try {
      setIsLoading(true);
      const data = await MedecinApiService.getSecretaires(token);
      setSecretaires(data);
    } catch (error) {
      console.error('Error loading secretaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSecretaire = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto: LierSecretaireDto = { email: formData.email };
      await MedecinApiService.lierSecretaire(token, dto);
      setShowAddForm(false);
      setFormData({ email: '', nom: '', prenom: '', numero: '' });
      loadSecretaires();
    } catch (error) {
      console.error('Error adding secretaire:', error);
    }
  };

  const handleUpdateSecretaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSecretaire) return;
    try {
      const dto: UpdateSecretaireDto = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        numero: formData.numero,
      };
      await MedecinApiService.updateSecretaire(token, editingSecretaire._id, dto); // Changed from id to _id
      setEditingSecretaire(null);
      setFormData({ email: '', nom: '', prenom: '', numero: '' });
      loadSecretaires();
    } catch (error) {
      console.error('Error updating secretaire:', error);
    }
  };

  const handleDeleteSecretaire = async (secretaireId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce secrétaire ?')) return;
    try {
      await MedecinApiService.removeSecretaire(token, secretaireId);
      loadSecretaires();
    } catch (error) {
      console.error('Error deleting secretaire:', error);
    }
  };

  const startEdit = (secretaire: Secretaire) => {
    setEditingSecretaire(secretaire);
    setFormData({
      email: secretaire.email,
      nom: secretaire.nom,
      prenom: secretaire.prenom,
      numero: secretaire.numero,
    });
  };

  const cancelEdit = () => {
    setEditingSecretaire(null);
    setShowAddForm(false);
    setFormData({ email: '', nom: '', prenom: '', numero: '' });
  };

  const filteredSecretaires = secretaires.filter((sec) =>
    sec.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sec.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sec.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Gestion de l'Équipe</h2>
                <p className="text-blue-100">Gérez vos secrétaires médicaux</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {/* Search and Add Button */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un secrétaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>
          {/* Add/Edit Form */}
          {(showAddForm || editingSecretaire) && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingSecretaire ? 'Modifier le secrétaire' : 'Ajouter un secrétaire'}
              </h3>
              <form onSubmit={editingSecretaire ? handleUpdateSecretaire : handleAddSecretaire}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemple.com"
                    />
                  </div>
                  {editingSecretaire && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nom de famille"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                        <input
                          type="text"
                          value={formData.prenom}
                          onChange={(e) => setFormData((prev) => ({ ...prev, prenom: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                        <input
                          type="tel"
                          value={formData.numero}
                          onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+216 XX XXX XXX"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {editingSecretaire ? 'Modifier' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Secretaires List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : filteredSecretaires.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Aucun secrétaire trouvé</p>
              </div>
            ) : (
              filteredSecretaires.map((secretaire) => (
                <div
                  key={secretaire._id} // Changed from id to _id
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {secretaire.prenom} {secretaire.nom}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{secretaire.email}</span>
                          </div>
                          {secretaire.numero && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{secretaire.numero}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(secretaire)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSecretaire(secretaire._id)} // Changed from id to _id
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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