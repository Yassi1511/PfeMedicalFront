export interface LoginData {
  email: string;
  motDePasse: string;
}

export interface RegisterData {
  adresse: string | undefined;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  motDePasse: string;
  role: 'Medecin' | 'Patient' | 'Secretaire';
  patients?: string[]; // For Medecin role
  Medecins?: string[]; // For Patient or Secretaire role
  dateNaissance?: string; // For Patient
  sexe?: string; // For Patient
  groupeSanguin?: string; // For Patient
  numeroLicence?: string; // For Medecin
  specialite?: string; // For Medecin
  adresseCabinet?: string; // For Medecin
  bureau?: string; // For Secretaire
  dateEmbauche?: string; // For Secretaire
}
export interface AuthResponse {
  token: string;
  role: string;
  _id: string;
}

export interface User {
  token: string;
  role: string;
}
export interface RegisterErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  numero?: string;
  motDePasse?: string;
  role?: string;
  dateNaissance?: string;
  sexe?: string;
  groupeSanguin?: string;
  numeroLicence?: string;
  specialite?: string;
  adresseCabinet?: string;
  bureau?: string;
  dateEmbauche?: string;
}