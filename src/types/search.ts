// Medecin API Types
export interface MedecinAPI {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  adresse: string;
  role: string;
  specialite: string;
  numeroLicence: string;
  adresseCabinet: string;
  Patients: string[];
  Secretaires: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  resetPasswordExpires?: string;
  resetPasswordToken?: string;
}

// Frontend Medecin Interface
export interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  adresse: string;
  specialite: string;
  numeroLicence: string;
  adresseCabinet: string;
  nombrePatients: number;
  nombreSecretaires: number;
  dateInscription: string;
}

// Search interfaces
export interface SearchMedecinParams {
  nom?: string;
  specialite?: string;
}