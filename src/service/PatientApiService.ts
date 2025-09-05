import { ApiService } from './api';
import { 
  OrdonnanceAPI, 
  RendezVousAPI, 
  MedicamentAPI, 
  CreateMedicamentDTO, 
  UpdateCommentaireDTO,
  CreateMedicamentResponse,
  RendezVous,
  Ordonnance,
  Medicament
} from '../types/patient';
import { MedecinAPI, Medecin, SearchMedecinParams } from '../types/search';

export class PatientApiService {
  // Ordonnances Methods
  static async getOrdonnances(token: string, patientId?: string): Promise<Ordonnance[]> {
    try {
      const response = await ApiService.get<OrdonnanceAPI[]>('/ordonnances/patient', token);
      console.log('Ordonnances API response:', response);
      return response.map(ord => ({
        id: ord._id,
        date: new Date(ord.dateEmission).toLocaleDateString('fr-FR'),
        medecin: `${ord.medecin.prenom} ${ord.medecin.nom}`,
        medicaments: ord.traitement.medicaments.map(med => med.nomCommercial),
        statut: 'Active', // Default status since not provided in API
        signatureElectronique: ord.signatureElectronique,
        traitementNom: ord.traitement.nom
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des ordonnances:', error);
      throw error;
    }
  }

  static async getOrdonnanceById(ordonnanceId: string, token: string): Promise<OrdonnanceAPI> {
    try {
      return await ApiService.get<OrdonnanceAPI>(`/ordonnances/patient/${ordonnanceId}`, token);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ordonnance:', error);
      throw error;
    }
  }

  // Rendez-vous Methods
  static async getRendezVous(token: string, patientId?: string): Promise<RendezVous[]> {
    try {
      const response = await ApiService.get<RendezVousAPI[]>('/rdv/patient/me', token);
      
      return response.map(rdv => ({
        id: rdv._id,
        date: rdv.date,
        heure: rdv.heure,
        medecin: `${rdv.medecinId.prenom} ${rdv.medecinId.nom}`,
        type: rdv.medecinId.specialite || 'Consultation',
        statut: this.formatStatut(rdv.statut),
        commentaire: rdv.commentaire
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      throw error;
    }
  }

  static async cancelRendezVous(rdvId: string, token: string): Promise<RendezVousAPI> {
    try {
      return await ApiService.put<RendezVousAPI>(`/rdv/annuler/${rdvId}`, {}, token);
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', error);
      throw error;
    }
  }

  static async addCommentToRendezVous(rdvId: string, commentaire: string, token: string): Promise<RendezVousAPI> {
    try {
      const data: UpdateCommentaireDTO = { commentaire };
      return await ApiService.put<RendezVousAPI>(`/rdv/patient/${rdvId}/commentaire`, data, token);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      throw error;
    }
  }

  // Medicaments Methods
  static async getMedicaments(token: string): Promise<Medicament[]> {
    try {
      const response = await ApiService.get<MedicamentAPI[]>('/medicaments', token);
      
      return response.map(med => ({
        id: med._id,
        dateDebut: new Date(med.dateDebut).toLocaleDateString('fr-FR'),
        dateFin: new Date(med.dateFin).toLocaleDateString('fr-FR'),
        dosage: med.dosage,
        frequence: med.frequence,
        nomCommercial: med.nomCommercial,
        voieAdministration: med.voieAdministration,
        horaires: med.horaires
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des médicaments:', error);
      throw error;
    }
  }

  static async addMedicament(medicamentData: CreateMedicamentDTO, token: string): Promise<CreateMedicamentResponse> {
    try {
      return await ApiService.post<CreateMedicamentResponse>('/medicaments', medicamentData, token);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médicament:', error);
      throw error;
    }
  }

  // Medecins Methods - New APIs
  static async getAllMedecins(token: string): Promise<Medecin[]> {
    try {
      const response = await ApiService.get<MedecinAPI[]>('/', token);
      console.log('Médecins API response:', response);
      
      return response.map(medecin => ({
        id: medecin._id,
        nom: medecin.nom,
        prenom: medecin.prenom,
        email: medecin.email,
        numero: medecin.numero,
        adresse: medecin.adresse,
        specialite: medecin.specialite,
        numeroLicence: medecin.numeroLicence,
        adresseCabinet: medecin.adresseCabinet,
        nombrePatients: medecin.Patients.length,
        nombreSecretaires: medecin.Secretaires.length,
        dateInscription: new Date(medecin.createdAt).toLocaleDateString('fr-FR')
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des médecins:', error);
      throw error;
    }
  }

  static async searchMedecinsBySpecialite(specialite: string, token: string): Promise<Medecin[]> {
    try {
      const response = await ApiService.get<MedecinAPI[]>(`/specialite/${encodeURIComponent(specialite)}`, token);
      console.log('Recherche par spécialité API response:', response);
      
      return response.map(medecin => ({
        id: medecin._id,
        nom: medecin.nom,
        prenom: medecin.prenom,
        email: medecin.email,
        numero: medecin.numero,
        adresse: medecin.adresse,
        specialite: medecin.specialite,
        numeroLicence: medecin.numeroLicence,
        adresseCabinet: medecin.adresseCabinet,
        nombrePatients: medecin.Patients.length,
        nombreSecretaires: medecin.Secretaires.length,
        dateInscription: new Date(medecin.createdAt).toLocaleDateString('fr-FR')
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche par spécialité:', error);
      throw error;
    }
  }

  static async searchMedecinsByName(nom: string, token: string): Promise<Medecin[]> {
    try {
      const response = await ApiService.get<MedecinAPI[]>(`/nom/${encodeURIComponent(nom)}`, token);
      console.log('Recherche par nom API response:', response);
      
      return response.map(medecin => ({
        id: medecin._id,
        nom: medecin.nom,
        prenom: medecin.prenom,
        email: medecin.email,
        numero: medecin.numero,
        adresse: medecin.adresse,
        specialite: medecin.specialite,
        numeroLicence: medecin.numeroLicence,
        adresseCabinet: medecin.adresseCabinet,
        nombrePatients: medecin.Patients.length,
        nombreSecretaires: medecin.Secretaires.length,
        dateInscription: new Date(medecin.createdAt).toLocaleDateString('fr-FR')
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche par nom:', error);
      throw error;
    }
  }

  // Utility Methods
  private static formatStatut(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'en_attente':
        return 'En attente';
      case 'confirmé':
        return 'Confirmé';
      case 'annulé':
        return 'Annulé';
      case 'terminé':
        return 'Terminé';
      default:
        return statut;
    }
  }

  // Additional utility methods for dashboard statistics
  static async getPatientStats(token: string): Promise<{
    totalRendezVous: number;
    totalOrdonnances: number;
    totalMedicaments: number;
    totalMedecins: number;
    prochainRendezVous?: RendezVous;
  }> {
    try {
      const [rendezVous, ordonnances, medicaments, medecins] = await Promise.all([
        this.getRendezVous(token),
        this.getOrdonnances(token),
        this.getMedicaments(token),
        this.getAllMedecins(token)
      ]);

      const now = new Date();
      const prochainRendezVous = rendezVous
        .filter(rdv => new Date(rdv.date) > now && rdv.statut !== 'Annulé')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      return {
        totalRendezVous: rendezVous.length,
        totalOrdonnances: ordonnances.length,
        totalMedicaments: medicaments.length,
        totalMedecins: medecins.length,
        prochainRendezVous
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}