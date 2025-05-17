import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, WalletInfo } from '../types'
import XrplService from '../services/xrplService'

export type AuthStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';

interface AuthState {
  // User state
  user: User | null;
  status: AuthStatus;
  error: string | null;
  
  // Wallet state
  walletAddress: string | null;
  walletProvider: string | null;
  walletBalance: number | null;
  
  // Authentication methods
  login: (provider: string) => Promise<void>;
  logout: () => void;
  
  // Wallet methods
  connectWallet: (address: string, provider: string) => Promise<void>;
  disconnectWallet: () => void;
  fetchWalletBalance: (address: string) => Promise<number>;
  refreshWalletBalance: () => Promise<void>;
  
  // Status helpers
  isConnected: () => boolean;
  isConnecting: () => boolean;
  isAuthenticated: () => boolean;
}

// Initialize the XRPL service with Testnet
const xrplService = XrplService.getInstance('testnet');

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      status: 'idle',
      error: null,
      
      // Wallet state
      walletAddress: null,
      walletProvider: null,
      walletBalance: null,
      
      // Authentication methods
      login: async (provider: string) => {
        set({ status: 'connecting', error: null });
        
        try {
          const { walletAddress } = get();
          
          if (!walletAddress) {
            throw new Error('Wallet not connected');
          }
          
          // Here you would typically call your backend API to authenticate the user
          // based on their wallet address or a signed message
          // For demo purposes, we're simulating a network call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // For now we're just creating a dummy user based on the wallet address
          const mockUser: User = {
            id: `user_${walletAddress.slice(0, 8)}`,
            companyName: 'Eco Innovations Inc.',
            email: `${walletAddress.slice(0, 8)}@example.com`,
            isAuthenticated: true
          };
          
          set({ 
            user: mockUser, 
            status: 'connected' 
          });
          
          return Promise.resolve();
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to login', 
            status: 'error' 
          });
          
          return Promise.reject(error);
        }
      },
      
      logout: () => {
        set({ 
          user: null,
          status: 'idle',
          walletAddress: null,
          walletProvider: null,
          walletBalance: null
        });
      },
      
      // Wallet methods
      connectWallet: async (address: string, provider: string) => {
        set({ status: 'connecting', error: null });
        
        try {
          // Validate the address format
          if (!XrplService.isValidXrplAddress(address)) {
            throw new Error(`Invalid XRPL address format: ${address}`);
          }
          
          // Fetch the wallet balance
          const balance = await get().fetchWalletBalance(address);
          
          set({ 
            status: 'connected',
            walletAddress: address,
            walletProvider: provider,
            walletBalance: balance
          });
          
          // Also login the user if we've got a wallet connected
          // In a real app we might want to sign a message to prove ownership
          const { user } = get();
          if (!user) {
            await get().login(provider);
          }
          
          return Promise.resolve();
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to connect wallet',
            status: 'error' 
          });
          
          return Promise.reject(error);
        }
      },
      
      disconnectWallet: () => {
        set({ 
          status: 'idle',
          walletAddress: null,
          walletProvider: null,
          walletBalance: null,
          user: null
        });
      },
      
      fetchWalletBalance: async (address: string) => {
        try {
          // Use our XRPL service to get the account balance
          const balance = await xrplService.getAccountBalance(address);
          
          // If this is for the currently connected wallet, update the store
          const { walletAddress } = get();
          if (walletAddress === address) {
            set({ walletBalance: balance });
          }
          
          return balance;
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
          return 0;
        }
      },
      
      refreshWalletBalance: async () => {
        const { walletAddress } = get();
        if (walletAddress) {
          await get().fetchWalletBalance(walletAddress);
        }
      },
      
      // Status helpers
      isConnected: () => {
        const { status } = get();
        return status === 'connected';
      },
      
      isConnecting: () => {
        const { status } = get();
        return status === 'connecting';
      },
      
      isAuthenticated: () => {
        const { user } = get();
        return Boolean(user?.isAuthenticated);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist these fields
        walletAddress: state.walletAddress,
        walletProvider: state.walletProvider,
        user: state.user
      })
    }
  )
);

export default useAuthStore;