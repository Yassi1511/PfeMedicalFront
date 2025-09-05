// API Response Interfaces - matching the actual API structure
export interface MedecinAPI {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  specialite: string;
  adresseCabinet: string;
}

export interface PatientAPI {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  dateNaissance: string;
  sexe: string;
  groupeSanguin: string;
  allergies: string;
}

export interface MedicamentAPI {
  _id: string;
  dateDebut: string;
  dateFin: string;
  dosage: string;
  frequence: number;
  nomCommercial: string;
  voieAdministration: string;
  horaires: string[];
  patient: string;
  notifications: string[];
}

export interface TraitementAPI {
  _id: string;
  nom: string;
  patient: string | PatientAPI;
  medicaments: MedicamentAPI[];
  medecin: string | MedecinAPI;
}

export interface OrdonnanceAPI {
  _id: string;
  destination: string | PatientAPI;
  medecin: MedecinAPI;
  signatureElectronique: string;
  traitement: TraitementAPI;
  dateEmission: string;
}

export interface RendezVousAPI {
  _id: string;
  medecinId: MedecinAPI;
  patientId: PatientAPI;
  date: string;
  heure: string;
  statut: string;
  commentaire?: string;
  createdAt: string;
  updatedAt: string;
}

// DTO Interfaces for requests
export interface CreateMedicamentDTO {
  dateDebut: string;
  dateFin: string;
  dosage: string;
  frequence: number;
  nomCommercial: string;
  voieAdministration: string;
  horaires: string[];
}

export interface UpdateCommentaireDTO {
  commentaire: string;
}

export interface CreateMedicamentResponse {
  message: string;
  medicament: MedicamentAPI;
}

// Frontend Interfaces - used by components
export interface RendezVous {
  id: string;
  date: string;
  heure: string;
  medecin: string;
  type: string;
  statut: string;
  commentaire?: string;
    patientNom?: string;
    patientPrenom?: string;
}

export interface Ordonnance {
  id: string;
  date: string;
  medecin: string;
  medicaments: string[];
  statut: string;
  signatureElectronique?: string;
  traitementNom?: string;
}

export interface Medicament {
  id: string;
  dateDebut: string;
  dateFin: string;
  dosage: string;
  frequence: number;
  nomCommercial: string;
  voieAdministration: string;
  horaires: string[];
}

export interface Patient {
  id: string; // Mapped from _id in API response
  nom: string;
  prenom: string;
  email: string;
  telephone?: string; // Maps to 'numero' in API response, optional
  dateNaissance: string;
  adresse?: string; // Optional, as not always present in API response
  dateInscription?: string; // Maps to 'createdAt' in API response, optional
}
