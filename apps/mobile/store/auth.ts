import { create } from "zustand";
import type { UserResponse } from "@servio/types";

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  authError: string | null;
  setUser: (user: UserResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  authError: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthError: (authError) => set({ authError }),
}));
