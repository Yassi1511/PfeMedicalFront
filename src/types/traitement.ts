export interface MedicamentTraitement {
  nomCommercial: string;
  dosage: string;
  frequence: number;
  voieAdministration: string;
  dateDebut: string;
  dateFin: string;
  horaires?: string[];
}

export interface CreateTraitementDTO {
  nom: string;
  observations: string;
  patient?: string; // Optional patient field
  medicaments: MedicamentTraitement[];
}

export interface UpdateTraitementDTO {
  nom?: string;
  observations?: string;
  patient?: string; // Optional patient field
  medicaments?: MedicamentTraitement[];
}

export interface Traitement {
  _id: string;
  nom: string;
  observations: string;
  patient: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    numero: string;
    dateNaissance: string;
    sexe: string;
    groupeSanguin: string;
    allergies: string;
  } | null;
  medicaments: Array<{
    _id: string;
    dateDebut: string;
    dateFin: string;
    dosage: string;
    frequence: number;
    nomCommercial: string;
    voieAdministration: string;
    horaires: string[];
    patient: string;
  }>;
  medecin: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    specialite: string;
  };
  __v: number;
}