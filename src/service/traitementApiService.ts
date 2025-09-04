import { ApiService } from './api';

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
  patient?: string; // Optional for create
  medicaments: MedicamentTraitement[];
}

export interface UpdateTraitementDTO {
  nom?: string;
  observations?: string;
  patient?: string; // Optional for update
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

export class TraitementApiService {
  /**
   * Create a new treatment
   */
  static async createTraitement(
    traitementData: CreateTraitementDTO,
    token: string
  ): Promise<Traitement> {
    return ApiService.post<Traitement>('/traitements', traitementData, token);
  }

  /**
   * Get all treatments created by the doctor
   */
  static async getAllTraitements(token: string): Promise<Traitement[]> {
    return ApiService.get<Traitement[]>('/traitements', token);
  }

  /**
   * Get treatments for a specific patient
   */
  static async getTraitementsByPatient(
    patientId: string,
    token: string
  ): Promise<Traitement[]> {
    return ApiService.get<Traitement[]>(`/traitements/patients/${patientId}`, token);
  }

  /**
   * Update a specific treatment
   */
  static async updateTraitement(
    traitementId: string,
    updateData: UpdateTraitementDTO,
    token: string
  ): Promise<Traitement> {
    return ApiService.put<Traitement>(`/traitements/${traitementId}`, updateData, token);
  }

  /**
   * Delete a specific treatment
   */
  static async deleteTraitement(
    traitementId: string,
    token: string
  ): Promise<void> {
    return ApiService.delete<void>(`/traitements/${traitementId}`, token);
  }
}