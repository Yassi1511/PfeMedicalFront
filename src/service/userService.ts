import axios from 'axios';
import { UserProfile, UpdateProfileData } from '../types/Profile';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const userService = {
  // Get user profile
  getProfile: async (token: string): Promise<UserProfile> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
  },

  // Update user profile
  updateProfile: async (token: string, data: UpdateProfileData): Promise<UserProfile> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Update profile response:', response.data); // Debug log
      return response.data.user; // Extract the 'user' field
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  },

  // Delete user profile
  deleteProfile: async (token: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error('Failed to delete profile');
    }
  },
};

export type { UserProfile, UpdateProfileData };