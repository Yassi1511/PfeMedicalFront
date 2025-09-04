import axios from 'axios';

const API_URL = 'http://localhost:3000/api/notifications';

export class NotificationApiService {
  static async getNotifications(token: string): Promise<Notification[]> {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Raw backend response:", response.data); // Log raw response
      const mappedNotifications = response.data.map((notif: any) => ({
        id: notif._id, // Map _id to id
        contenu: notif.contenu,
        type: notif.type,
        horaire: notif.horaire,
        lu: notif.lu,
        dateEnvoi: notif.dateEnvoi,
        patient: notif.patient,
        medicament: notif.medicament,
      }));
      console.log("Mapped notifications:", mappedNotifications); // Log mapped data
      return mappedNotifications;
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des notifications');
    }
  }

  static async markAsRead(notificationId: string, token: string): Promise<void> {
    try {
      const url = `${API_URL}/${notificationId}/lire`;
      console.log("Sending PUT request to:", url); // Debug log
      await axios.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la notification');
    }
  }

  static async generateNotification(medicamentId: string, token: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/generer/${medicamentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error: any) {
      console.error("Error generating notification:", error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la génération de la notification');
    }
  }
}