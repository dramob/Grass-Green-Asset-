import './sdg'
export * from './sdg'

// API Response Types
export interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  score: string; // 'AAA', 'AA', 'A', 'BBB', etc.
  volume24h: number;
  description: string;
  impactSummary: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TokenDetail extends Token {
  priceHistory: PricePoint[];
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface ScoreResult {
  draftId: string;
  score: string;
  details: {
    sustainability: number;
    impact: number;
    transparency: number;
    viability: number;
  };
  sdgVerification?: ProjectVerification;
  status: 'scored' | 'pending' | 'failed';
}

export interface CompanyAsset {
  id: string;
  name: string;
  symbol: string;
  status: 'draft' | 'scoring' | 'rejected' | 'approved' | 'listed';
  score?: string;
  createdAt: string;
  updatedAt: string;
}

// Form Types
export interface ListingFormData {
  companyName: string;
  projectName: string;
  projectSymbol: string;
  supply: number;
  price: number;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  documents: File[];
  impactSummary: string;
  sdgClaims: SDGClaim[];
}

// Auth Types
export interface User {
  id: string;
  companyName: string;
  email: string;
  isAuthenticated: boolean;
}

// Wallet Types
export interface WalletInfo {
  address: string;
  isConnected: boolean;
}

// Transaction Types
export interface Transaction {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  price: number;
  fees: number;
  total: number;
  txHash?: string;
}
