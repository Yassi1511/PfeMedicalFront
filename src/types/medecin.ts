export interface User {
  token: string;
  role: string;
}

export interface Secretaire {
  _id: string; // Changed from id to _id
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  motDePasse?: string;
  role: string;
  bureau: string;
  Medecins: string[];
  dateEmbauche: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface RendezVous {
  _id: string; // Changed from id to _id
  medecinId: Medecin;
  patientId: Patient;
  date: string;
  heure: string;
  statut: 'en_attente' | 'confirme' | 'consulté' | 'annule';
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
export interface Medecin {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  motDePasse?: string;
  role: string;
  specialite: string;
  numeroLicence: string;
  adresseCabinet: string;
  Patients: string[];
  Secretaires: string[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
export interface Patient {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  motDePasse?: string;
  role: string;
  dateNaissance: string;
  sexe: string;
  groupeSanguin: string;
  allergies: string;
  Medecins: string[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface Notification {
  id: string;
  contenu: string;
  type: string; // e.g., "rappel"
  horaire?: string; // e.g., "08:00"
  lu: boolean;
  dateEnvoi: string;
  patient: string | { _id: string; [key: string]: any }; // Reference to patient
  medicament: {
    _id: string;
    nomCommercial: string;
    dosage: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LierSecretaireDto {
  email: string;
}

export interface UpdateSecretaireDto {
  nom: string;
  prenom: string;
  email: string;
  numero: string;
}

export interface Ordonnance {
  _id: string;
  destination: Patient; // Populated
  medecin: Medecin; // Populated
  traitement: Traitement; // Populated
  signatureElectronique?: string | null;
  dateEmission: string;
  __v?: number;
}

export interface Traitement {
  _id: string;
  nom: string;
  observations?: string;
  patient: Patient;
  medicaments: Medicament[];
  medecin: Medecin;
  __v?: number;
}

export interface Medicament {
  _id: string;
  nomCommercial: string;
  dosage: string;
  frequence: number;
  voieAdministration: string;
  dateDebut: string;
  dateFin: string;
  horaires: string[];
  patient: Patient;
  notifications: string[];
  __v?: number;
}