import { SDGData } from '../components/ui/SDGSelection'

export interface VerificationResult {
  sdgId: number
  verificationScore: number // 0-100
  confidenceLevel: 'high' | 'medium' | 'low'
  evidenceFound: boolean
  evidenceSummary: string
  sources: string[]
}

export interface ProjectVerificationResults {
  projectId: string
  companyName: string
  totalScore: number
  verificationDate: Date
  results: VerificationResult[]
}

class VerificationService {
  private static instance: VerificationService

  private constructor() {}

  // Singleton pattern
  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService()
    }
    return VerificationService.instance
  }

  /**
   * Verify SDG claims by searching for company information online
   * In a real implementation, this would call an AI service with web search capabilities
   */
  public async verifySDGClaims(
    companyName: string,
    projectName: string, 
    sdgs: SDGData[]
  ): Promise<ProjectVerificationResults> {
    // This is a mock implementation
    // In a real app, this would make an API call to an LLM service with web search
    console.log(`Verifying SDG claims for ${companyName} - ${projectName}`)
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock verification results
    const results: VerificationResult[] = sdgs.map(sdg => ({
      sdgId: sdg.id,
      // Generate a random score between 30 and 95
      verificationScore: Math.floor(Math.random() * (95 - 30 + 1)) + 30,
      // Assign confidence level based on score
      confidenceLevel: this.getConfidenceLevel(Math.floor(Math.random() * (95 - 30 + 1)) + 30),
      // 70% chance of finding evidence
      evidenceFound: Math.random() > 0.3,
      evidenceSummary: `Based on available information about ${companyName}, we ${Math.random() > 0.3 ? 'found' : 'could not find'} sufficient evidence to support the claim that the project contributes to SDG ${sdg.id}. ${this.generateEvidenceSummary(sdg.id)}`,
      sources: this.generateMockSources()
    }))
    
    const totalScore = Math.floor(
      results.reduce((sum, result) => sum + result.verificationScore, 0) / results.length
    )
    
    return {
      projectId: `proj_${Date.now().toString(36)}`,
      companyName,
      totalScore,
      verificationDate: new Date(),
      results
    }
  }
  
  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }
  
  private generateEvidenceSummary(sdgId: number): string {
    // Mock evidence summaries based on SDG ID
    const summaries = [
      "Company sustainability reports mention initiatives related to this goal.",
      "Recent news articles discuss the company's commitment to this area.",
      "The company has received recognition for work in this field.",
      "Public statements from company leadership support these claims.",
      "There is limited public information available about this specific goal.",
      "The company website describes projects aligned with this objective.",
      "Third-party evaluations confirm some level of engagement in this area."
    ]
    
    return summaries[sdgId % summaries.length]
  }
  
  private generateMockSources(): string[] {
    const sources = [
      "Company Website",
      "Annual Sustainability Report",
      "ESG Database",
      "News Articles",
      "Industry Analysis",
      "UN Global Compact",
      "Government Records",
      "NGO Publications"
    ]
    
    // Return 2-4 random sources
    const numSources = Math.floor(Math.random() * 3) + 2
    const selectedSources: string[] = []
    
    for (let i = 0; i < numSources; i++) {
      const randomIndex = Math.floor(Math.random() * sources.length)
      const source = sources[randomIndex]
      
      if (!selectedSources.includes(source)) {
        selectedSources.push(source)
      }
    }
    
    return selectedSources
  }
}

export default VerificationService