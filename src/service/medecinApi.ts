import { ApiService } from './api';
import { Secretaire, LierSecretaireDto, UpdateSecretaireDto, ApiResponse } from '../types/medecin';

// Define the Medecin type (based on expected response from getMedecinsBySecretaire)
interface Medecin {
  _id: string;
  nom: string;
  prenom: string;
  email?: string;
  specialite?: string;
}
interface SecretairesResponse {
  secretaires: Secretaire[];
}
// Define the API response type for medecins
interface MedecinsResponse {
  medecins: Medecin[];
}
export class MedecinApiService {
  // Link a secretary to the doctor
  static async lierSecretaire(token: string, dto: LierSecretaireDto): Promise<ApiResponse<Secretaire>> {
    return ApiService.post<ApiResponse<Secretaire>>('/secretaires', dto, token);
  }

    static async getSecretaires(token: string): Promise<Secretaire[]> {
    const response = await ApiService.get<SecretairesResponse>('/secretaires', token);
    return response.secretaires; // Extract the secretaires array
  }
  // Remove a secretary
  static async removeSecretaire(token: string, secretaireId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<ApiResponse<void>>(`/secretaires/${secretaireId}`, token);
  }

  // Update secretary information
  static async updateSecretaire(
    token: string, 
    secretaireId: string, 
    dto: UpdateSecretaireDto
  ): Promise<ApiResponse<Secretaire>> {
    return ApiService.put<ApiResponse<Secretaire>>(`/secretaires/${secretaireId}`, dto, token);
  }

  // Get all doctors linked to the secretary
  static async getMedecinsBySecretaire(token: string): Promise<Medecin[]> {
    const response = await ApiService.get<MedecinsResponse>('/medecins-by-secretaire', token);
    return response.medecins; // Extract the medecins array
  }
}