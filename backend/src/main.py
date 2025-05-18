from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Path, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import uvicorn
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import asyncio
from datetime import datetime
import json
import logging

# Import models
from models.project import (
    Project, SDGClaim, VerificationResult, ProjectVerification, 
    ProjectStatus, project_to_dict, dict_to_project
)

# Import storage service
from services.storage.project_storage import ProjectStorageService

# Import API routers
from services.api.certification_api import router as certification_router
from services.api.token_api import router as token_router
from services.api.oracle_api import router as oracle_router

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check for OpenAI key
if not os.getenv("OPENAI_KEY"):
    logger.warning("OPENAI_KEY environment variable not set. LLM features will not work.")

# Import the LLM certification module
from controllers.LLMCertification import scrape_brave_and_condense as scrape_and_condense
# Import the MCP-based search and verification
from controllers.scrape_and_verify import scrape_brave_and_condense_mcp

# Initialize services
project_storage = ProjectStorageService()

app = FastAPI(
    title="Green Asset API",
    description="API for Green Asset Platform with SDG claim verification and MP Token issuance",
    version="0.1.0"
)

# Service dependency
def get_project_storage():
    return project_storage

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(certification_router)
app.include_router(token_router)
app.include_router(oracle_router)

# API Request/Response Models
class SDGClaimRequest(BaseModel):
    sdgId: int
    checked: bool
    justification: str

class ProjectRequest(BaseModel):
    companyName: str
    projectName: str
    description: str
    sdgClaims: List[SDGClaimRequest]

class VerificationRequest(BaseModel):
    companyName: str
    projectName: str
    sdgClaims: List[SDGClaimRequest]

class VerificationResultResponse(BaseModel):
    sdgId: int
    verificationScore: float  # 0-100
    confidenceLevel: str  # 'high', 'medium', 'low'
    evidenceFound: bool
    evidenceSummary: str
    sources: List[str]

class VerificationResponse(BaseModel):
    projectId: str
    companyName: str
    totalScore: float
    verificationDate: str
    results: List[VerificationResultResponse]
    
class ProjectResponse(BaseModel):
    id: str
    companyName: str
    projectName: str
    description: str
    status: str
    createdAt: str
    updatedAt: str
    sdgClaims: List[Dict[str, Any]]
    verification: Optional[Dict[str, Any]] = None
    
class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int

@app.get("/")
def read_root():
    return {"status": "online", "service": "Green Asset API"}

# Project management endpoints
@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectRequest,
    storage: ProjectStorageService = Depends(get_project_storage)
):
    """
    Create a new project with SDG claims
    """
    try:
        # Convert to internal model
        sdg_claims = [
            SDGClaim(
                sdg_id=claim.sdgId,
                checked=claim.checked,
                justification=claim.justification
            )
            for claim in project_data.sdgClaims
        ]
        
        project = Project(
            company_name=project_data.companyName,
            project_name=project_data.projectName,
            description=project_data.description,
            sdg_claims=sdg_claims,
            status=ProjectStatus.DRAFT
        )
        
        # Save to storage
        storage.save_project(project)
        
        logger.info(f"Created new project: {project.id}")
        
        # Convert to response format
        return ProjectResponse(
            id=project.id,
            companyName=project.company_name,
            projectName=project.project_name,
            description=project.description,
            status=project.status,
            createdAt=project.created_at.isoformat(),
            updatedAt=project.updated_at.isoformat(),
            sdgClaims=[{
                "sdgId": claim.sdg_id,
                "checked": claim.checked,
                "justification": claim.justification
            } for claim in project.sdg_claims],
            verification=None
        )
    except Exception as e:
        logger.exception(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@app.get("/api/projects", response_model=ProjectListResponse)
async def list_projects(
    status: Optional[str] = Query(None, description="Filter by status"),
    company_name: Optional[str] = Query(None, description="Filter by company name"),
    storage: ProjectStorageService = Depends(get_project_storage)
):
    """
    List all projects with optional filters
    """
    try:
        # Convert status string to enum if provided
        status_filter = None
        if status:
            try:
                status_filter = ProjectStatus(status)
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid status: {status}. Valid values: {[s.value for s in ProjectStatus]}"
                )
        
        # Get projects from storage
        projects = storage.list_projects(
            status=status_filter, 
            company_name=company_name
        )
        
        # Convert to response format
        response_projects = []
        for project in projects:
            response_projects.append(ProjectResponse(
                id=project.id,
                companyName=project.company_name,
                projectName=project.project_name,
                description=project.description,
                status=project.status,
                createdAt=project.created_at.isoformat(),
                updatedAt=project.updated_at.isoformat(),
                sdgClaims=[{
                    "sdgId": claim.sdg_id,
                    "checked": claim.checked,
                    "justification": claim.justification
                } for claim in project.sdg_claims],
                verification=project.verification.dict() if project.verification else None
            ))
        
        return ProjectListResponse(
            projects=response_projects,
            total=len(response_projects)
        )
    except Exception as e:
        logger.exception(f"Error listing projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing projects: {str(e)}")

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str = Path(..., description="Project ID"),
    storage: ProjectStorageService = Depends(get_project_storage)
):
    """
    Get a project by ID
    """
    try:
        project = storage.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
        
        # Convert to response format
        return ProjectResponse(
            id=project.id,
            companyName=project.company_name,
            projectName=project.project_name,
            description=project.description,
            status=project.status,
            createdAt=project.created_at.isoformat(),
            updatedAt=project.updated_at.isoformat(),
            sdgClaims=[{
                "sdgId": claim.sdg_id,
                "checked": claim.checked,
                "justification": claim.justification
            } for claim in project.sdg_claims],
            verification=project.verification.dict() if project.verification else None
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.exception(f"Error getting project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting project: {str(e)}")

@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: str = Path(..., description="Project ID"),
    storage: ProjectStorageService = Depends(get_project_storage)
):
    """
    Delete a project
    """
    try:
        success = storage.delete_project(project_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
        
        return {"success": True, "message": f"Project {project_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")

@app.patch("/api/projects/{project_id}/status")
async def update_project_status(
    project_id: str = Path(..., description="Project ID"),
    status: ProjectStatus = Body(..., embed=True),
    storage: ProjectStorageService = Depends(get_project_storage)
):
    """
    Update a project's status
    """
    try:
        success = storage.update_project_status(project_id, status)
        if not success:
            raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
        
        return {"success": True, "message": f"Project {project_id} status updated to {status}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating project status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating project status: {str(e)}")

@app.post("/api/verification", response_model=VerificationResponse)
async def verify_sdg_claims(
    request: VerificationRequest, 
    background_tasks: BackgroundTasks,
    storage: ProjectStorageService = Depends(get_project_storage),
    project_id: Optional[str] = Query(None, description="Existing project ID")
):
    """
    Verify SDG claims for a project using LLM with web search
    
    If project_id is provided, the verification results will be stored with the existing project.
    Otherwise, a new project will be created.
    """
    try:
        # Extract active SDG claims
        active_claims = [claim for claim in request.sdgClaims if claim.checked]
        
        if not active_claims:
            raise HTTPException(status_code=400, detail="No active SDG claims provided")
        
        # Check if OpenAI API key is available
        if not os.getenv("OPENAI_KEY"):
            logger.warning("OPENAI_KEY not set, using mock verification data")
            verification_response = generate_mock_verification_response(request)
            
            # Store verification results with project
            background_tasks.add_task(
                store_verification_with_project,
                storage,
                verification_response,
                project_id,
                request
            )
            
            return verification_response
        
        # Process each SDG claim
        verification_results = []
        
        for claim in active_claims:
            # Create search query based on company name and SDG claim
            query = f"{request.companyName} sustainability {claim.justification}"
            
            # Extract keywords from the justification
            keywords = [w for w in claim.justification.split() if len(w) > 3][:10]
            
            # First try using MCP-based search
            try:
                result = await scrape_brave_and_condense_mcp(
                    query=query,
                    num_results=5,  # Limit to 5 results per claim for efficiency
                    sdg_goal=claim.sdgId,
                    keywords=keywords
                )
                logger.info(f"Using MCP-based Brave search for SDG {claim.sdgId}")
            except Exception as e:
                logger.warning(f"MCP search failed, falling back to direct API: {e}")
                # Fall back to original search if MCP fails
                result = await scrape_and_condense(
                    query=query,
                    num_results=5,  # Limit to 5 results per claim for efficiency
                    sdg_goal=claim.sdgId,
                    keywords=keywords
                )
            
            # Process the result
            if result["success"]:
                verification_results.append(VerificationResultResponse(
                    sdgId=claim.sdgId,
                    verificationScore=result["score"],
                    confidenceLevel="high" if result["score"] >= 80 else 
                                   "medium" if result["score"] >= 50 else "low",
                    evidenceFound=result["evidence_found"],
                    evidenceSummary=result["condensed"][:1000],  # Limit length
                    sources=result["results"]
                ))
            else:
                verification_results.append(VerificationResultResponse(
                    sdgId=claim.sdgId,
                    verificationScore=0,
                    confidenceLevel="low",
                    evidenceFound=False,
                    evidenceSummary="No evidence found to support this claim.",
                    sources=[]
                ))
        
        # Calculate total score
        total_score = sum(r.verificationScore for r in verification_results) / len(verification_results)
        
        # Generate a project ID if none provided
        if not project_id:
            project_id = f"proj_{uuid.uuid4().hex[:8]}"
        
        # Create verification response
        verification_response = VerificationResponse(
            projectId=project_id,
            companyName=request.companyName,
            totalScore=total_score,
            verificationDate=str(datetime.now().isoformat()),
            results=verification_results
        )
        
        # Store verification results with project
        background_tasks.add_task(
            store_verification_with_project,
            storage,
            verification_response,
            project_id,
            request
        )
        
        return verification_response
    
    except Exception as e:
        logger.exception(f"Verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
        
def generate_mock_verification_response(request: VerificationRequest) -> VerificationResponse:
    """
    Generate a mock verification response for testing when API keys are not available
    """
    import random
    
    verification_results = []
    
    for claim in [c for c in request.sdgClaims if c.checked]:
        # Generate a random score for demonstration
        score = random.randint(50, 95)
        
        verification_results.append(VerificationResultResponse(
            sdgId=claim.sdgId,
            verificationScore=score,
            confidenceLevel="high" if score >= 80 else "medium" if score >= 50 else "low",
            evidenceFound=True,
            evidenceSummary=f"[Mock Data] Analysis of {request.companyName}'s sustainability initiatives suggests {score}% alignment with their claim: '{claim.justification}'",
            sources=[f"https://example.com/mock/{request.companyName.lower().replace(' ', '-')}/{claim.sdgId}"]
        ))
    
    total_score = sum(r.verificationScore for r in verification_results) / len(verification_results)
    
    return VerificationResponse(
        projectId=f"mock_{uuid.uuid4().hex[:8]}",
        companyName=request.companyName,
        totalScore=total_score,
        verificationDate=str(datetime.now().isoformat()),
        results=verification_results
    )

async def store_verification_with_project(
    storage: ProjectStorageService,
    verification_response: VerificationResponse,
    project_id: Optional[str],
    request: VerificationRequest
):
    """
    Store verification results with a project
    
    If project_id is provided, update the existing project.
    Otherwise, create a new project.
    """
    try:
        # Create VerificationResult objects for internal storage
        verification_results = [
            VerificationResult(
                sdg_id=result.sdgId,
                verification_score=result.verificationScore,
                confidence_level=result.confidenceLevel,
                evidence_found=result.evidenceFound,
                evidence_summary=result.evidenceSummary,
                sources=result.sources
            )
            for result in verification_response.results
        ]
        
        # Create verification object
        verification = ProjectVerification(
            verification_id=f"ver_{uuid.uuid4().hex[:8]}",
            company_name=verification_response.companyName,
            project_id=verification_response.projectId,
            total_score=verification_response.totalScore,
            verification_date=datetime.fromisoformat(verification_response.verificationDate.replace('Z', '+00:00')),
            results=verification_results
        )
        
        # If project_id is provided, update existing project
        if project_id:
            project = storage.get_project(project_id)
            if project:
                project.verification = verification
                project.status = ProjectStatus.VERIFICATION_COMPLETE
                storage.save_project(project)
                logger.info(f"Updated project {project_id} with verification results")
                return
        
        # Create a new project with verification results
        sdg_claims = [
            SDGClaim(
                sdg_id=claim.sdgId,
                checked=claim.checked,
                justification=claim.justification
            )
            for claim in request.sdgClaims if claim.checked
        ]
        
        project = Project(
            id=verification_response.projectId,
            company_name=request.companyName,
            project_name=request.projectName,
            description="", # Empty description for now
            sdg_claims=sdg_claims,
            status=ProjectStatus.VERIFICATION_COMPLETE,
            verification=verification
        )
        
        storage.save_project(project)
        logger.info(f"Created new project {project.id} with verification results")
    
    except Exception as e:
        logger.exception(f"Error storing verification with project: {e}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)