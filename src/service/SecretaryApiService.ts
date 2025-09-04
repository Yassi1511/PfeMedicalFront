import { ApiService } from './api';

export interface PatientData {
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  dateNaissance: string;
  adresse: string;
  motDePasse: string;
  sexe?: string;
  groupeSanguin?: string;
  Medecins?: string[]; // List of doctor IDs
}

export interface PatientInfo {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  dateNaissance: string;
  adresse: string;
  sexe?: string;
  groupeSanguin?: string;
  Medecins: string[];
  dateInscription: string;
}

export interface RendezVousData {
  patientId: string;
  medecinId: string;
  date: string;
  heure: string;
  commentaire?: string;
}

export interface RendezVousInfo {
  id: string;
  patientNom: string;
  patientPrenom: string;
  patientId: string;
  medecinId: string;
  medecin: string;
  date: string;
  heure: string;
  statut: string;
  commentaire?: string;
}

export interface MedecinInfo {
  _id: string;
  nom: string;
  prenom: string;
  specialite: string;
  email: string;
}

export interface NotificationData {
  patientId: string;
  type: 'rdv' | 'ordonnance' | 'info' | 'urgence';
  titre: string;
  message: string;
}

interface MedecinsResponse {
  medecins: MedecinInfo[];
}

interface PatientsResponse {
  patients: PatientInfo[];
}

export class SecretaryApiService {
  // Gestion des patients
  static async getPatientsBySecretaire(token: string): Promise<PatientInfo[]> {
    try {
      const response = await ApiService.get<PatientsResponse>('/patients-by-secretaire', token);
      return Array.isArray(response.patients) ? response.patients : [];
    } catch (error) {
      console.error('Error fetching patients by secretaire:', error);
      return [];
    }
  }

  static async createPatient(token: string, patientData: PatientData): Promise<PatientInfo> {
    return ApiService.post<PatientInfo>('/secretary/patients', patientData, token);
  }

  static async getPatientById(token: string, patientId: string): Promise<PatientInfo> {
    return ApiService.get<PatientInfo>(`/patients/patient/${patientId}`, token);
  }

  static async updatePatient(token: string, patientId: string, data: Partial<PatientData>): Promise<PatientInfo> {
    return ApiService.put<PatientInfo>(`/patients/${patientId}`, data, token);
  }

  static async deletePatient(token: string, patientId: string): Promise<{ success: boolean }> {
    return ApiService.delete<{ success: boolean }>(`/secretary/patients/${patientId}`, token);
  }

  static async searchPatients(token: string, query: string): Promise<PatientInfo[]> {
    return ApiService.get<PatientInfo[]>(`/secretary/patients/search?q=${encodeURIComponent(query)}`, token);
  }

  static async getPatientsByMedecinId(token: string, medecinId: string): Promise<PatientInfo[]> {
    try {
      const response = await ApiService.get<PatientsResponse>(`/${medecinId}/patients`, token);
      console.log('getPatientsByMedecinId response:', response);
      return Array.isArray(response.patients) ? response.patients : [];
    } catch (error) {
      console.error('Error fetching patients by medecin ID:', error);
      return [];
    }
  }

  // Gestion des rendez-vous
  static async getRendezVous(token: string, date?: string): Promise<RendezVousInfo[]> {
    const endpoint = date ? `/rendez-vous?date=${date}` : '/rendez-vous';
    return ApiService.get<RendezVousInfo[]>(endpoint, token);
  }

  static async getRendezVousById(token: string, rdvId: string): Promise<RendezVousInfo> {
    return ApiService.get<RendezVousInfo>(`/rdv/${rdvId}`, token); // Changed to match backend
  }

  static async createRendezVous(token: string, rdvData: RendezVousData): Promise<RendezVousInfo> {
    return ApiService.post<RendezVousInfo>('/rdv', rdvData, token); // Changed to consistent endpoint
  }

  static async updateRendezVous(token: string, rdvId: string, data: Partial<RendezVousData>): Promise<RendezVousInfo> {
    return ApiService.put<RendezVousInfo>(`/rdv/modifier/${rdvId}`, data, token); // Changed to match updated backend
  }

  static async deleteRendezVous(token: string, rdvId: string): Promise<{ success: boolean }> {
    return ApiService.delete<{ success: boolean }>(`/rdv/${rdvId}`, token); // Added for delete
  }

  static async cancelRendezVous(token: string, rdvId: string, reason?: string): Promise<{ success: boolean }> {
    return ApiService.put<{ success: boolean }>(`/rendez-vous/annuler/${rdvId}`, { reason }, token); // Changed to match backend
  }

  static async confirmRendezVous(token: string, rdvId: string): Promise<{ success: boolean }> {
    return ApiService.put<{ success: boolean }>(`/rdv/consulter/${rdvId}`, {}, token); // Changed to match backend (assuming confirm is consulter)
  }

  // Disponibilités des médecins
  static async getMedecins(token: string): Promise<MedecinInfo[]> {
    try {
      const response = await ApiService.get<MedecinsResponse>('/medecins-by-secretaire', token);
      return Array.isArray(response.medecins) ? response.medecins : [];
    } catch (error) {
      console.error('Error fetching medecins:', error);
      return [];
    }
  }

  static async getMedecinAvailability(token: string, medecinId: string, date: string, heure: string): Promise<boolean> {
    const response = await ApiService.get<{ disponible: boolean }>(`/rdv/disponibilite/test/main?medecinId=${medecinId}&date=${date}&heure=${heure}`, token);
    return response.disponible;
  }

  // Notifications
  static async sendNotification(token: string, notificationData: NotificationData): Promise<{ success: boolean }> {
    return ApiService.post<{ success: boolean }>('/secretary/notifications', notificationData, token);
  }

  static async sendBulkNotification(token: string, data: { patientIds: string[]; notification: Omit<NotificationData, 'patientId'> }): Promise<{ success: boolean }> {
    return ApiService.post<{ success: boolean }>('/secretary/notifications/bulk', data, token);
  }

  // Rapports et statistiques
  static async getAppointmentStats(token: string, startDate: string, endDate: string): Promise<any> {
    return ApiService.get<any>(`/secretary/stats/appointments?start=${startDate}&end=${endDate}`, token);
  }

  static async getPatientStats(token: string): Promise<any> {
    return ApiService.get<any>('/secretary/stats/patients', token);
  }

  // Gestion administrative
  static async updatePatientInsurance(token: string, patientId: string, insuranceData: any): Promise<{ success: boolean }> {
    return ApiService.put<{ success: boolean }>(`/secretary/patients/${patientId}/insurance`, insuranceData, token);
  }

  static async addPatientNote(token: string, patientId: string, note: string): Promise<{ success: boolean }> {
    return ApiService.post<{ success: boolean }>(`/secretary/patients/${patientId}/notes`, { note }, token);
  }

  static async getPatientNotes(token: string, patientId: string): Promise<Array<{ id: string; note: string; date: string; author: string }>> {
    return ApiService.get<Array<{ id: string; note: string; date: string; author: string }>>(`/secretary/patients/${patientId}/notes`, token);
  }
}