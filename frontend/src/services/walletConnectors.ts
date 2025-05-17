import { Xumm } from 'xumm-sdk'
import XrplService from './xrplService'
import walletConfig from '../config/wallets'

// Interface for all wallet connectors
export interface WalletConnector {
  name: string;
  connect(): Promise<{ address: string, provider: string, qrCodeUrl?: string }>;
  disconnect(): Promise<void>;
  supportsQRCode: boolean;
  supportsDeepLink: boolean;
  icon: string;
}

// Base class with common functionality
abstract class BaseWalletConnector implements WalletConnector {
  name: string;
  supportsQRCode: boolean = false;
  supportsDeepLink: boolean = false;
  icon: string;
  
  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
  }
  
  abstract connect(): Promise<{ address: string, provider: string, qrCodeUrl?: string }>;
  
  async disconnect(): Promise<void> {
    // Default implementation - can be overridden by specific connectors
    console.log(`${this.name} wallet disconnected`);
  }
}

// Xaman (XUMM) Wallet connector
export class XamanConnector extends BaseWalletConnector {
  private address: string | null = null;
  private xummSDK: any = null;
  private apiKey: string;
  
  constructor() {
    super('Xaman', '/wallet-icons/xumm.svg');
    this.apiKey = walletConfig.xaman.apiKey;
    this.supportsQRCode = true;
    this.supportsDeepLink = true;
  }
  
  async connect(): Promise<{ address: string, provider: string, qrCodeUrl?: string }> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Xaman SDK requires browser environment');
      }
      
      // Initialize Xaman SDK if not already done
      if (!window.xumm) {
        // Check if the Xumm constructor is available
        if (typeof window.Xumm !== 'function') {
          throw new Error('Xaman SDK not loaded. Make sure the script is included in your HTML.');
        }
        
        // Create a new Xumm SDK instance
        window.xumm = new window.Xumm(this.apiKey);
      }
      
      this.xummSDK = window.xumm;
      
      // Create a promise that will resolve when the user has successfully signed in
      const loginPromise = new Promise<string>((resolve, reject) => {
        // Set up event listeners
        this.xummSDK.on('ready', () => {
          console.log('Xaman SDK ready');
        });
        
        this.xummSDK.on('success', async () => {
          try {
            const account = await this.xummSDK.user.account;
            resolve(account);
          } catch (error) {
            reject(error);
          }
        });
        
        this.xummSDK.on('error', (error: any) => {
          reject(error);
        });
        
        // Initiate the authorization flow
        this.xummSDK.authorize();
      });
      
      // Wait for the user to authorize through Xaman
      this.address = await loginPromise;
      
      console.log('Connected to Xaman wallet:', this.address);
      
      return {
        address: this.address,
        provider: this.name,
        // No QR code URL is needed as the SDK handles this internally
      };
    } catch (error) {
      console.error('Failed to connect to Xaman wallet:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (this.xummSDK) {
        await this.xummSDK.logout();
      }
      
      this.address = null;
      await super.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Xaman:', error);
      throw error;
    }
  }
}

// GemWallet connector
export class GemWalletConnector extends BaseWalletConnector {
  private address: string | null = null;
  
  constructor() {
    super('GemWallet', '/wallet-icons/gem.svg');
    this.supportsDeepLink = true;
  }
  
  async connect(): Promise<{ address: string, provider: string }> {
    try {
      // Check if GemWallet is available in window object
      if (typeof window !== 'undefined' && window.gemWallet) {
        try {
          const isConnected = await window.gemWallet.isConnected();
          if (!isConnected.result.isConnected) {
            const connectResponse = await window.gemWallet.connect();
            if (connectResponse.result && connectResponse.result.address) {
              this.address = connectResponse.result.address;
            } else {
              throw new Error('Failed to retrieve address from GemWallet');
            }
          } else {
            // Already connected, get the address
            const accountResponse = await window.gemWallet.account();
            if (accountResponse.result && accountResponse.result.address) {
              this.address = accountResponse.result.address;
            } else {
              throw new Error('Failed to retrieve address from GemWallet');
            }
          }
        } catch (error) {
          console.error('GemWallet connection error:', error);
          throw error;
        }
      } else {
        // Fallback for development or when GemWallet is not available
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.address = 'rLiooJRSKeiNfRJcDBUh54g7EPiKJ5hMqa';
        } else {
          throw new Error('GemWallet extension not installed. Please install GemWallet to continue.');
        }
      }
      
      console.log('Connected to GemWallet:', this.address);
      
      return {
        address: this.address!,
        provider: this.name
      };
    } catch (error) {
      console.error('Failed to connect to GemWallet:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.gemWallet) {
        await window.gemWallet.disconnect();
      }
      this.address = null;
      await super.disconnect();
    } catch (error) {
      console.error('Error disconnecting from GemWallet:', error);
      throw error;
    }
  }
}

// Crossmark connector
export class CrossmarkConnector extends BaseWalletConnector {
  private address: string | null = null;
  
  constructor() {
    super('Crossmark', '/wallet-icons/crossmark.svg');
    this.supportsDeepLink = true;
  }
  
  async connect(): Promise<{ address: string, provider: string }> {
    try {
      // Check if Crossmark is available in window object
      if (typeof window !== 'undefined' && window.crossmark) {
        try {
          const isConnected = await window.crossmark.isConnected();
          if (!isConnected) {
            const connectResponse = await window.crossmark.connect();
            if (connectResponse && connectResponse.address) {
              this.address = connectResponse.address;
            } else {
              throw new Error('Failed to retrieve address from Crossmark');
            }
          } else {
            // Already connected, get the address
            const accountResponse = await window.crossmark.getAddress();
            if (accountResponse && accountResponse.address) {
              this.address = accountResponse.address;
            } else {
              throw new Error('Failed to retrieve address from Crossmark');
            }
          }
        } catch (error) {
          console.error('Crossmark connection error:', error);
          throw error;
        }
      } else {
        // Fallback for development or when Crossmark is not available
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.address = 'rJb9CXAWyB4rj91VRWn96DkukG4bwdtyTg';
        } else {
          throw new Error('Crossmark extension not installed. Please install Crossmark to continue.');
        }
      }
      
      console.log('Connected to Crossmark:', this.address);
      
      return {
        address: this.address!,
        provider: this.name
      };
    } catch (error) {
      console.error('Failed to connect to Crossmark:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.crossmark) {
        await window.crossmark.disconnect();
      }
      this.address = null;
      await super.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Crossmark:', error);
      throw error;
    }
  }
}

// Google OAuth connector with XRPL wallet creation
export class GoogleConnector extends BaseWalletConnector {
  private address: string | null = null;
  private xrplService = XrplService.getInstance();
  
  constructor() {
    super('Google', '/wallet-icons/google.svg');
  }
  
  async connect(): Promise<{ address: string, provider: string }> {
    try {
      // In a real implementation, we would use the Google OAuth API
      // For demo purposes, we'll simulate the Google OAuth flow
      
      console.log('Starting Google OAuth authentication...');
      
      // Simulate Google OAuth authentication
      // In a real implementation, this would use the actual Google OAuth API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a user ID for demo purposes
      const mockGoogleId = 'google-user-' + Math.floor(Math.random() * 10000);
      console.log('Google OAuth authenticated with ID:', mockGoogleId);
      
      // In a real implementation, we would check if the user already has a wallet in our database
      const hasExistingWallet = Math.random() > 0.5;
      
      if (hasExistingWallet) {
        // Simulate retrieving an existing wallet from a backend
        const hash = Array.from(mockGoogleId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        this.address = `rG${hash}JKLwB4rj91VRWn96DkukG4bwdtyTh`;
        console.log('Retrieved existing wallet for Google user:', this.address);
      } else {
        // Create a new XRPL wallet
        console.log('Creating new XRPL wallet for Google user...');
        
        try {
          // In a real implementation, this would be done securely on a server
          const wallet = await this.xrplService.createTestWallet();
          this.address = wallet.address;
          
          console.log('Created new wallet for Google user:', {
            address: this.address,
            // The seed would be stored securely on the server, not exposed here
          });
        } catch (error) {
          console.error('Failed to create wallet:', error);
          // Provide a fallback address for development
          if (process.env.NODE_ENV === 'development') {
            this.address = `rGoogleUser${Date.now()}FailoverAddressXRPL`;
          } else {
            throw error;
          }
        }
      }
      
      return {
        address: this.address!,
        provider: 'Google-XRPL'
      };
    } catch (error) {
      console.error('Failed to connect with Google:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    // For Google OAuth, we just need to clear local state
    this.address = null;
    await super.disconnect();
  }
}

// Connector registry and factory
export class WalletConnectorRegistry {
  private static connectors: Map<string, WalletConnector> = new Map();
  
  static {
    // Register default connectors
    this.register('xaman', new XamanConnector());
    this.register('gemwallet', new GemWalletConnector());
    this.register('crossmark', new CrossmarkConnector());
    this.register('google', new GoogleConnector());
    
    // For backward compatibility
    this.register('xumm', this.get('xaman')!);
  }
  
  static register(id: string, connector: WalletConnector): void {
    this.connectors.set(id.toLowerCase(), connector);
  }
  
  static get(id: string): WalletConnector | undefined {
    return this.connectors.get(id.toLowerCase());
  }
  
  static getAll(): WalletConnector[] {
    return Array.from(this.connectors.values());
  }
  
  static getConnector(type: string): WalletConnector {
    const connector = this.get(type.toLowerCase());
    if (!connector) {
      throw new Error(`Unknown wallet type: ${type}`);
    }
    return connector;
  }
  
  // Helper to check if a wallet supports QR codes
  static supportsQRCode(type: string): boolean {
    try {
      const connector = this.getConnector(type);
      return connector.supportsQRCode;
    } catch {
      return false;
    }
  }
  
  // Helper to check if a wallet supports deep linking
  static supportsDeepLink(type: string): boolean {
    try {
      const connector = this.getConnector(type);
      return connector.supportsDeepLink;
    } catch {
      return false;
    }
  }
}

// For TypeScript global window extensions
declare global {
  interface Window {
    xumm?: any;
    Xumm?: any;
    gemWallet?: any;
    crossmark?: any;
  }
}

export default WalletConnectorRegistry;