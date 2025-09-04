import { ApiService } from './api';
import { Ordonnance, Patient, Traitement } from '../types/medecin';

interface OrdonnanceResponse {
  ordonnance: Ordonnance;
}

interface PatientsResponse {
  patients: Patient[];
}

interface TraitementsResponse {
  traitements: Traitement[];
}

export class OrdonnanceApiService {
  static async getOrdonnancesByMedecin(token: string): Promise<Ordonnance[]> {
    try {
      const response = await ApiService.get<Ordonnance[]>('/ordonnances/medecin', token);
      console.log('getOrdonnancesByMedecin response:', response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching ordonnances:', error);
      return [];
    }
  }

  static async getOrdonnanceById(token: string, id: string): Promise<Ordonnance> {
    try {
      const response = await ApiService.get<OrdonnanceResponse>(`/ordonnances/medecin/${id}`, token);
      console.log('getOrdonnanceById response:', response);
      return response.ordonnance;
    } catch (error) {
      console.error('Error fetching ordonnance by ID:', error);
      throw error;
    }
  }

  static async ajouterOrdonnance(
    token: string,
    destination: string,
    traitement: string,
    signatureElectronique?: File
  ): Promise<Ordonnance> {
    try {
      const formData = new FormData();
      formData.append('destination', destination);
      formData.append('traitement', traitement);
      if (signatureElectronique) {
        formData.append('signatureElectronique', signatureElectronique);
      }
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      const response = await ApiService.post<OrdonnanceResponse>('/ordonnances', formData, token);
      console.log('ajouterOrdonnance response:', response);
      return response.ordonnance;
    } catch (error) {
      console.error('Error adding ordonnance:', error);
      throw error;
    }
  }

  static async getPatients(token: string, medecinId: string): Promise<Patient[]> {
    try {
      const response = await ApiService.get<PatientsResponse>(`/${medecinId}/patients`, token);
      console.log('getPatients response:', response);
      return Array.isArray(response.patients) ? response.patients : [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  static async getTraitements(token: string): Promise<Traitement[]> {
    try {
      const response = await ApiService.get<TraitementsResponse>('/traitements', token);
      console.log('getTraitements response:', response);
      if (Array.isArray(response.traitements)) {
        return response.traitements;
      }
      console.warn('getTraitements: Response is not an array or is empty');
      return [];
    } catch (error) {
      console.error('Error fetching traitements:', error);
      return [];
    }
  }

  static async getTraitementsByMedecin(token: string, medecinId: string): Promise<Traitement[]> {
    try {
      const response = await ApiService.get<TraitementsResponse>('/traitements/medecin', token);
      console.log('getTraitementsByMedecin response:', response);
      if (Array.isArray(response.traitements)) {
        return response.traitements;
      }
      console.warn('getTraitementsByMedecin: Response is not an array or is empty');
      return [];
    } catch (error) {
      console.error('Error fetching traitements by medecin:', error);
      return [];
    }
  }
}