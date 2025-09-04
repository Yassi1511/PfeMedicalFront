import { ApiService } from './api';
import { RendezVous, ApiResponse } from '../types/medecin';

export class RdvApiService {
  // Get today's appointments
  static async getRendezVousAujourdhui(token: string): Promise<RendezVous[]> {
    return ApiService.get<RendezVous[]>('/rdv/aujourdhui', token);
  }

  // Mark appointment as consulted
  static async consulterRendezVous(token: string, rdvId: string): Promise<ApiResponse<RendezVous>> {
    return ApiService.put<ApiResponse<RendezVous>>(`/rdv/consulter/${rdvId}`, {}, token);
  }

  // Get all appointments for the doctor
  static async getAllRendezVous(token: string): Promise<RendezVous[]> {
    return ApiService.get<RendezVous[]>('/rdv', token);
  }
}