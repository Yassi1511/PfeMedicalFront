import axios from 'axios';
import { LoginData, RegisterData, AuthResponse } from '../types'; 

const baseUri = import.meta.env.VITE_API_BASE_URL;
export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${baseUri}/users/login`, data);

      const authData = response.data;

      // Store token and role in localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('userRole', authData.role);
      localStorage.setItem('id', authData._id);

      return authData;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Email ou mot de passe incorrect');
      }
      throw new Error('Erreur de connexion');
    }
  },

  register: async (data: RegisterData): Promise<void> => {
    try {
      await axios.post(`${baseUri}/users/register`, data);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Erreur lors de l\'inscription');
      }
      throw new Error('Erreur lors de l\'inscription');
    }
  },
 forgotPassword: async (data: { email: string }): Promise<void> => {
    try {
      await axios.post(`${baseUri}/users/forget-password`, data);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
      }
      throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  },
};