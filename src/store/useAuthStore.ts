
import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (provider: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: