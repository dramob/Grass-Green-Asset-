"""
FastAPI endpoints for MP Token issuance and management
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import from other modules
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import the certification and bridge
from controllers.LLMCertification import certify_project
from services.api.py_node_bridge import execute_js_bridge

# Create router
router = APIRouter(
    prefix="/api/tokens",
    tags=["tokenization"],
    responses={404: {"description": "Not found"}},
)

# Request/Response Models
class SDGVerification(BaseModel):
    sdg: str
    score: float
    justification: str

class TokenRequest(BaseModel):
    company_name: str
    project_name: str
    description: str = ""
    wallet_seed: str
    sdg_claims: List[Dict[str, Any]] = []
    maximum_amount: Optional[str] = "100000000"
    asset_scale: Optional[int] = 0
    transfer_fee: Optional[int] = 0

class TokenResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    issuance_id: Optional[str] = None
    issuer_address: Optional[str] = None
    token_amount: Optional[int] = None
    project_details: Optional[Dict[str, Any]] = None

class AuthorizeRequest(BaseModel):
    issuer_seed: str
    holder_address: str
    issuance_id: str

class MintRequest(BaseModel):
    issuer_seed: str
    holder_address: str
    issuance_id: str
    amount: int

class TokenHoldingsResponse(BaseModel):
    success: bool
    address: Optional[str] = None
    holdings: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# Token issuance endpoint
@router.post("/issue", response_model=TokenResponse)
async def create_token_issuance(request: TokenRequest):
    """
    Create a new MP Token issuance for a green asset based on certification
    """
    try:
        # First, certify the project using LLMCertification
        certification_data = {
            "company_name": request.company_name,
            "proponent": request.company_name,
            "description": request.description,
            "sdg_claims": request.sdg_claims
        }
        
        certification_result = certify_project(certification_data)
        
        if not certification_result["success"]:
            return TokenResponse(
                success=False,
                message=certification_result.get("message", "Project certification failed")
            )
        
        # Calculate token amount from certification
        cert_data = certification_result["data"]
        token_amount = cert_data.get("Tokens to Mint", 0)
        
        # Prepare token data
        token_data = {
            "name": request.company_name,
            "description": request.description,
            "company": request.company_name,
            "sdgs": [item["sdg"] for item in cert_data.get("SDG_Verifications", [])],
            "verificationScore": cert_data.get("Geometric Mean Score", 0),
            "maximumAmount": request.maximum_amount,
            "assetScale": request.asset_scale,
            "transferFee": request.transfer_fee
        }
        
        # Call the Node.js bridge to create the token
        params = {
            "walletSeed": request.wallet_seed,
            "tokenData": token_data
        }
        
        result = await execute_js_bridge("createGreenAssetToken", params)
        
        if not result["success"]:
            return TokenResponse(
                success=False,
                message=result.get("error", "Token creation failed")
            )
        
        return TokenResponse(
            success=True,
            issuance_id=result["issuanceID"],
            issuer_address=result["issuerWallet"],
            token_amount=token_amount,
            project_details=cert_data
        )
    
    except Exception as e:
        return TokenResponse(
            success=False,
            message=f"Token issuance failed: {str(e)}"
        )

# Authorize token holder endpoint
@router.post("/authorize", response_model=TokenResponse)
async def authorize_token_holder(request: AuthorizeRequest):
    """
    Authorize a holder for an MP token
    """
    try:
        # Call the Node.js bridge to authorize holder
        params = {
            "issuerSeed": request.issuer_seed,
            "holderAddress": request.holder_address,
            "issuanceID": request.issuance_id
        }
        
        result = await execute_js_bridge("authorizeHolder", params)
        
        if not result.get("success", False):
            return TokenResponse(
                success=False,
                message=result.get("error", "Authorization failed")
            )
        
        return TokenResponse(
            success=True,
            message="Holder authorized successfully",
            issuance_id=request.issuance_id
        )
    
    except Exception as e:
        return TokenResponse(
            success=False,
            message=f"Authorization failed: {str(e)}"
        )

# Mint tokens endpoint
@router.post("/mint", response_model=TokenResponse)
async def mint_tokens(request: MintRequest):
    """
    Mint tokens to a holder
    """
    try:
        # Call the Node.js bridge to mint tokens
        params = {
            "issuerSeed": request.issuer_seed,
            "holderAddress": request.holder_address,
            "issuanceID": request.issuance_id,
            "amount": request.amount
        }
        
        result = await execute_js_bridge("mintToHolder", params)
        
        if not result.get("success", False):
            return TokenResponse(
                success=False,
                message=result.get("error", "Minting failed")
            )
        
        return TokenResponse(
            success=True,
            message="Tokens minted successfully",
            issuance_id=request.issuance_id,
            token_amount=request.amount
        )
    
    except Exception as e:
        return TokenResponse(
            success=False,
            message=f"Minting failed: {str(e)}"
        )

# Get token holdings endpoint
@router.get("/holdings/{address}", response_model=TokenHoldingsResponse)
async def get_token_holdings(address: str, issuance_id: Optional[str] = None):
    """
    Get token holdings for an account
    """
    try:
        # Call the Node.js bridge to get holdings
        params = {
            "account": address,
            "issuanceID": issuance_id
        }
        
        result = await execute_js_bridge("getHoldings", params)
        
        if not result.get("success", False):
            return TokenHoldingsResponse(
                success=False,
                message=result.get("error", "Failed to get holdings")
            )
        
        return TokenHoldingsResponse(
            success=True,
            address=address,
            holdings=result.get("result", {}).get("node", {})
        )
    
    except Exception as e:
        return TokenHoldingsResponse(
            success=False,
            message=f"Failed to get holdings: {str(e)}"
        )