"""
Project and SDG claim data models
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    VERIFICATION_COMPLETE = "verification_complete"
    TOKENIZED = "tokenized"
    LISTED = "listed"
    REJECTED = "rejected"

class SDGClaim(BaseModel):
    sdg_id: int
    checked: bool = True
    justification: str
    
class VerificationResult(BaseModel):
    sdg_id: int
    verification_score: float  # 0-100
    confidence_level: str  # 'high', 'medium', 'low'
    evidence_found: bool
    evidence_summary: str
    sources: List[str]

class ProjectVerification(BaseModel):
    verification_id: str
    company_name: str
    project_id: str
    total_score: float
    verification_date: datetime
    results: List[VerificationResult]

class Project(BaseModel):
    id: str = Field(default_factory=lambda: f"proj_{int(datetime.now().timestamp())}")
    company_name: str
    project_name: str
    description: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    status: ProjectStatus = ProjectStatus.DRAFT
    sdg_claims: List[SDGClaim]
    verification: Optional[ProjectVerification] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

def project_to_dict(project: Project) -> Dict[str, Any]:
    """Convert a project model to a dictionary for storage"""
    return {
        "id": project.id,
        "company_name": project.company_name,
        "project_name": project.project_name,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "status": project.status,
        "sdg_claims": [claim.dict() for claim in project.sdg_claims],
        "verification": project.verification.dict() if project.verification else None
    }

def dict_to_project(data: Dict[str, Any]) -> Project:
    """Convert a dictionary to a project model"""
    # Handle datetime fields
    if "created_at" in data and isinstance(data["created_at"], str):
        data["created_at"] = datetime.fromisoformat(data["created_at"])
    if "updated_at" in data and isinstance(data["updated_at"], str):
        data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        
    # Handle nested models
    if "sdg_claims" in data:
        data["sdg_claims"] = [SDGClaim(**claim) for claim in data["sdg_claims"]]
    if "verification" in data and data["verification"]:
        verification_data = data["verification"]
        if "verification_date" in verification_data and isinstance(verification_data["verification_date"], str):
            verification_data["verification_date"] = datetime.fromisoformat(verification_data["verification_date"])
        if "results" in verification_data:
            verification_data["results"] = [VerificationResult(**result) for result in verification_data["results"]]
        data["verification"] = ProjectVerification(**verification_data)
    
    return Project(**data)