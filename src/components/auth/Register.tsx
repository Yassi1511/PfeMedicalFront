import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone, UserPlus, AlertCircle, Loader2, ChevronDown, Calendar, Stethoscope, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { RegisterData } from '../../types';
import { RegisterErrors } from '../../types';
import { authService } from '../../service/auth';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

interface RegisterProps {
  onToggleForm: () => void;
  onRegisterSuccess: () => void;
}

export default function Register({ onToggleForm, onRegisterSuccess }: RegisterProps) {
  const [formData, setFormData] = useState<RegisterData>({
    nom: '',
    prenom: '',
    email: '',
    numero: '',
    motDePasse: '',
    role: 'Medecin',
    dateNaissance: '',
    sexe: '',
    groupeSanguin: '',
    numeroLicence: '',
    specialite: '',
    adresseCabinet: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterErrors>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  const navigate = useNavigate();

  const roles = [
    { value: 'Medecin', label: 'Médecin', description: 'Accès complet aux dossiers patients' },
    { value: 'Patient', label: 'Patient', description: 'Accès aux rendez-vous et dossiers médicaux' },
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const sexes = ['Homme', 'Femme'];
  const specialties = ['Généraliste', 'Cardiologue', 'Dermatologue', 'Pédiatre', 'Neurologue', 'Autre'];

  // Validation schemas for each step
  const step1Schema = Yup.object().shape({
    role: Yup.string().required('Le type de compte est requis').oneOf(['Medecin', 'Patient'], 'Type de compte invalide'),
  });

  const step2Schema = Yup.object().shape({
    nom: Yup.string()
      .required('Le nom est requis')
      .min(2, 'Le nom doit contenir au moins 2 caractères'),
    prenom: Yup.string()
      .required('Le prénom est requis')
      .min(2, 'Le prénom doit contenir au moins 2 caractères'),
    email: Yup.string()
      .required('L\'adresse email est requise')
      .email('Format d\'email invalide'),
    numero: Yup.string()
      .required('Le numéro de téléphone est requis')
      .matches(/^(\+216)?[2579]\d{7}$/, 'Format de numéro invalide (ex: +21622222222 ou 22222222)'),
    motDePasse: Yup.string()
      .required('Le mot de passe est requis')
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  });

  const patientStep3Schema = Yup.object().shape({
    dateNaissance: Yup.string().required('La date de naissance est requise'),
    sexe: Yup.string().required('Le sexe est requis').oneOf(['Homme', 'Femme'], 'Sexe invalide'),
    groupeSanguin: Yup.string()
      .required('Le groupe sanguin est requis')
      .oneOf(bloodGroups, 'Groupe sanguin invalide'),
  });

  const medecinStep3Schema = Yup.object().shape({
    numeroLicence: Yup.string().required('Le numéro de licence est requis'),
    specialite: Yup.string().required('La spécialité est requise'),
    adresseCabinet: Yup.string().required('L\'adresse du cabinet est requise'),
  });

const validateStep = async (): Promise<boolean> => {
  try {
    if (currentStep === 1) {
      await step1Schema.validate({ role: formData.role }, { abortEarly: false });
    } else if (currentStep === 2) {
      await step2Schema.validate(formData, { abortEarly: false });
    } else if (currentStep === 3) {
      if (formData.role === 'Patient') {
        await patientStep3Schema.validate(formData, { abortEarly: false });
      } else {
        await medecinStep3Schema.validate(formData, { abortEarly: false });
      }
    }

    setErrors({});
    return true;
  } catch (err) {
    if (err instanceof Yup.ValidationError) {
      const newErrors: RegisterErrors = {};
      err.inner.forEach(error => {
        if (error.path && (error.path in formData)) {
          // Only assign errors for fields that exist in RegisterErrors
          newErrors[error.path as keyof RegisterErrors] = error.message;
        }
      });
      setErrors(newErrors);
    }
    return false;
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (currentStep < 3) {
      if (await validateStep()) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

    if (!(await validateStep())) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(formData);
      setSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      setTimeout(() => {
        onRegisterSuccess();
        onToggleForm();
      }, 2000);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof RegisterErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectedRole = roles.find(role => role.value === formData.role);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Inscription</h2>
        <p className="text-gray-600 mt-2">Créez votre compte médical</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 flex justify-between items-center">
        <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <p className="text-sm mt-2">Type de compte</p>
        </div>
        <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <p className="text-sm mt-2">Informations générales</p>
        </div>
        <div className={`flex-1 text-center ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <p className="text-sm mt-2">Détails spécifiques</p>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{serverError}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Type de compte
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none ${
                  errors.role ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <option value="">Sélectionner le type de compte</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
            {selectedRole && (
              <p className="mt-1 text-xs text-gray-600">{selectedRole.description}</p>
            )}
            {errors.role && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.role}
              </p>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.nom ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Nom"
                  />
                </div>
                {errors.nom && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.nom}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.prenom ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Prénom"
                  />
                </div>
                {errors.prenom && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.prenom}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="votre.email@exemple.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.numero ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="+21622222222"
                />
              </div>
              {errors.numero && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.numero}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="motDePasse"
                  name="motDePasse"
                  value={formData.motDePasse}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.motDePasse ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="Mot de passe (min. 6 caractères)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.motDePasse && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.motDePasse}
                </p>
              )}
            </div>
          </>
        )}

        {currentStep === 3 && formData.role === 'Patient' && (
          <>
            <div>
              <label htmlFor="dateNaissance" className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  id="dateNaissance"
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.dateNaissance ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                />
              </div>
              {errors.dateNaissance && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.dateNaissance}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sexe" className="block text-sm font-medium text-gray-700 mb-2">
                Sexe
              </label>
              <div className="relative">
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none ${
                    errors.sexe ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <option value="">Sélectionner le sexe</option>
                  {sexes.map((sexe) => (
                    <option key={sexe} value={sexe}>
                      {sexe}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              {errors.sexe && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.sexe}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="groupeSanguin" className="block text-sm font-medium text-gray-700 mb-2">
                Groupe sanguin
              </label>
              <div className="relative">
                <select
                  id="groupeSanguin"
                  name="groupeSanguin"
                  value={formData.groupeSanguin}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none ${
                    errors.groupeSanguin ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <option value="">Sélectionner le groupe sanguin</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              {errors.groupeSanguin && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.groupeSanguin}
                </p>
              )}
            </div>
          </>
        )}

        {currentStep === 3 && formData.role === 'Medecin' && (
          <>
            <div>
              <label htmlFor="numeroLicence" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de licence
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="numeroLicence"
                  name="numeroLicence"
                  value={formData.numeroLicence}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.numeroLicence ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="Numéro de licence"
                />
              </div>
              {errors.numeroLicence && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.numeroLicence}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="specialite" className="block text-sm font-medium text-gray-700 mb-2">
                Spécialité
              </label>
              <div className="relative">
                <select
                  id="specialite"
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none ${
                    errors.specialite ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <option value="">Sélectionner la spécialité</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              {errors.specialite && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.specialite}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="adresseCabinet" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse du cabinet
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="adresseCabinet"
                  name="adresseCabinet"
                  value={formData.adresseCabinet}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.adresseCabinet ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="Adresse du cabinet"
                />
              </div>
              {errors.adresseCabinet && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.adresseCabinet}
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-between gap-4">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:bg-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Précédent
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${
              currentStep === 1 ? 'ml-auto' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création en cours...
              </>
            ) : currentStep === 3 ? (
              'Créer le compte'
            ) : (
              <>
                Suivant <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Déjà un compte ?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-green-600 hover:text-green-800 font-medium transition-colors"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}