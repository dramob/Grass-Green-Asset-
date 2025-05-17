// SDG Types

/**
 * Represents the 17 Sustainable Development Goals (SDGs) defined by the UN
 */
export enum SDGGoal {
  NoPoverty = 1,
  ZeroHunger = 2,
  GoodHealth = 3,
  QualityEducation = 4,
  GenderEquality = 5,
  CleanWater = 6,
  CleanEnergy = 7,
  DecentWork = 8,
  Industry = 9,
  ReducedInequality = 10,
  SustainableCities = 11,
  ResponsibleConsumption = 12,
  ClimateAction = 13,
  LifeBelowWater = 14,
  LifeOnLand = 15,
  PeaceAndJustice = 16,
  Partnerships = 17
}

/**
 * Information about an SDG goal
 */
export interface SDGInfo {
  id: SDGGoal;
  name: string;
  description: string;
  iconPath?: string;
}

/**
 * SDG claim made by a project
 */
export interface SDGClaim {
  sdgId: SDGGoal;
  checked: boolean;
  justification: string;
}

/**
 * Verification result for an SDG claim
 */
export interface SDGVerificationResult {
  sdgId: number;
  verificationScore: number; // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  evidenceFound: boolean;
  evidenceSummary: string;
  sources: string[];
}

/**
 * Complete verification results for a project
 */
export interface ProjectVerification {
  projectId: string;
  companyName: string;
  totalScore: number;
  verificationDate: Date;
  results: SDGVerificationResult[];
}

/**
 * Project submission data
 */
export interface ProjectSubmission {
  companyName: string;
  projectName: string;
  description: string;
  sdgClaims: SDGClaim[];
}