export interface UserProfile {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  numero: string;
  role: string;
  Patients: string[];
  Secretaires: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface UpdateProfileData {
  nom?: string;
  prenom?: string;
  email?: string;
  numero?: string;
}
