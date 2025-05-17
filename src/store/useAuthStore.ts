import { create } from 'zustand'
import { User, WalletInfo } from '../types'
import XrplService from '../services/xrplService'

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isConnecting: boolean;
  isConnected: boolean;
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
}

// Initialize the XRPL service with Testnet
const xrplService = XrplService.getInstance('testnet')

export const useAuthStore = create<AuthState>((set, get) => ({
  // User state
  user: null,
  isLoading: false,
  error: null,
  
  // Wallet state
  isConnecting: false,
  isConnected: false,
  walletAddress: null,
  walletProvider: null,
  walletBalance: null,
  
  // Authentication methods
  login: async (provider: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const { walletAddress } = get()
      
      if (!walletAddress) {
        throw new Error('Wallet not connected')
      }
      
      // Here you would typically call your backend API to authenticate the user
      // based on their wallet address or a signed message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For now we're just creating a dummy user based on the wallet address
      const mockUser: User = {
        id: `user_${walletAddress.slice(0, 8)}`,
        companyName: 'Eco Innovations Inc.',
        email: `${walletAddress.slice(0, 8)}@example.com`,
        isAuthenticated: true
      }
      
      set({ user: mockUser, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to login', isLoading: false })
    }
  },
  
  logout: () => {
    set({ 
      user: null,
      isConnected: false,
      walletAddress: null,
      walletProvider: null,
      walletBalance: null
    })
  },
  
  // Wallet methods
  connectWallet: async (address: string, provider: string) => {
    set({ isConnecting: true, error: null })
    
    try {
      // Validate the address format
      if (!XrplService.isValidXrplAddress(address)) {
        throw new Error(`Invalid XRPL address format: ${address}`)
      }
      
      // Fetch the wallet balance
      const balance = await get().fetchWalletBalance(address)
      
      set({ 
        isConnected: true,
        walletAddress: address,
        walletProvider: provider,
        walletBalance: balance,
        isConnecting: false
      })
      
      // Also login the user if we've got a wallet connected
      // In a real app we might want to sign a message to prove ownership
      const { user } = get()
      if (!user) {
        await get().login(provider)
      }
      
      return Promise.resolve()
    } catch (error) {
      set({ 
        error: 'Failed to connect wallet',
        isConnecting: false 
      })
      
      return Promise.reject(error)
    }
  },
  
  disconnectWallet: () => {
    set({ 
      isConnected: false,
      walletAddress: null,
      walletProvider: null,
      walletBalance: null
    })
  },
  
  fetchWalletBalance: async (address: string) => {
    try {
      // Use our XRPL service to get the account balance
      const balance = await xrplService.getAccountBalance(address)
      return balance
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      return 0
    }
  }
}))

export default useAuthStore