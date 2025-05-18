"""
FastAPI endpoints for project certification using LLM
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import sys
from pathlib import Path
import json
from datetime import datetime

# Add the parent directory to sys.path to import from other modules
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import the certification functions
from controllers.LLMCertification import certify_project

# Create router
router = APIRouter(
    prefix="/api/certification",
    tags=["certification"],
    responses={404: {"description": "Not found"}},
)

# Request/Response Models
class SDGClaim(BaseModel):
    sdg_id: int
    justification: str

class CertificationRequest(BaseModel):
    company_name: str
    project_name: str = ""
    description: str = ""
    sdg_claims: List[SDGClaim]

class VerificationResult(BaseModel):
    sdgId: int
    verificationScore: float  # 0-100
    confidenceLevel: str  # 'high', 'medium', 'low'
    evidenceFound: bool
    evidenceSummary: str
    sources: List[str]

class CertificationResponse(BaseModel):
    success: bool
    projectId: Optional[str] = None
    companyName: Optional[str] = None
    totalScore: Optional[float] = None
    verificationDate: Optional[str] = None
    results: Optional[List[VerificationResult]] = None
    tokenAmount: Optional[int] = None
    geometricMeanScore: Optional[float] = None
    emissionReductions: Optional[float] = None
    industry: Optional[str] = None
    credibleSources: Optional[List[str]] = None
    message: Optional[str] = None

@router.post("", response_model=CertificationResponse)
async def certify_project_endpoint(request: CertificationRequest):
    """
    Certify a project's SDG claims using LLM with web search capability
    """
    try:
        # Prepare certification data
        certification_data = {
            "company_name": request.company_name,
            "proponent": request.company_name,
            "description": request.description,
            "sdg_claims": [
                {
                    "sdg_id": claim.sdg_id,
                    "justification": claim.justification
                }
                for claim in request.sdg_claims
            ]
        }
        
        # Call the certification function
        result = certify_project(certification_data)
        
        if not result["success"]:
            return CertificationResponse(
                success=False,
                message=result.get("message", "Certification failed")
            )
        
        # Extract verification data
        data = result["data"]
        
        # Transform SDG verification data
        verification_results = []
        for item in data.get("SDG_Verifications", []):
            # Extract SDG ID from format like "SDG 1"
            try:
                sdg_text = item.get("sdg", "")
                sdg_id = int(''.join(filter(str.isdigit, sdg_text)))
            except:
                sdg_id = 0
                
            score = item.get("score", 0) * 10  # Scale 0-10 to 0-100
            
            verification_results.append(VerificationResult(
                sdgId=sdg_id,
                verificationScore=score,
                confidenceLevel="high" if score >= 80 else "medium" if score >= 50 else "low",
                evidenceFound=score > 30,
                evidenceSummary=item.get("justification", ""),
                sources=data.get("Credible_Sources", [])
            ))
        
        # Generate project ID
        import uuid
        project_id = f"cert_{uuid.uuid4().hex[:8]}"
        
        # Calculate total score
        total_score = (
            sum(r.verificationScore for r in verification_results) / 
            len(verification_results)
        ) if verification_results else 0
        
        return CertificationResponse(
            success=True,
            projectId=project_id,
            companyName=request.company_name,
            totalScore=total_score,
            verificationDate=datetime.now().isoformat(),
            results=verification_results,
            tokenAmount=data.get("Tokens to Mint", 0),
            geometricMeanScore=data.get("Geometric Mean Score", 0),
            emissionReductions=data.get("Estimated Annual Emission Reductions", 0),
            industry=data.get("Industry", ""),
            credibleSources=data.get("Credible_Sources", [])
        )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return CertificationResponse(
            success=False,
            message=f"Certification failed: {str(e)}"
        )