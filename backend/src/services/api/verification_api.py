"""
Verification API Service for making requests to the backend API.
This would normally be used by the frontend to communicate with the backend.
"""

import os
import json
import aiohttp
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class VerificationAPIService:
    """Service for interacting with the verification API"""
    
    def __init__(self, api_base_url=None):
        """Initialize the service with base URL from env or parameter"""
        self.base_url = api_base_url or os.getenv("API_BASE_URL", "http://localhost:3000/api")
        self.headers = {
            "Content-Type": "application/json",
        }
        if os.getenv("API_KEY"):
            self.headers["Authorization"] = f"Bearer {os.getenv('API_KEY')}"
    
    async def verify_sdg_claims(self, company_name: str, project_name: str, sdg_claims: List[Dict]) -> Dict[str, Any]:
        """
        Send SDG claims to the verification API for processing
        
        Args:
            company_name: Name of the company
            project_name: Name of the project
            sdg_claims: List of SDG claims with id, checked, and justification
            
        Returns:
            Verification results
        """
        try:
            endpoint = f"{self.base_url}/verification"
            payload = {
                "companyName": company_name,
                "projectName": project_name,
                "sdgClaims": sdg_claims
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, json=payload, headers=self.headers) as response:
                    response.raise_for_status()
                    return await response.json()
        
        except aiohttp.ClientError as e:
            logger.error(f"Error connecting to verification API: {e}")
            # Return mock data for demonstration if API is unavailable
            return self._generate_mock_verification(company_name, project_name, sdg_claims)
            
        except Exception as e:
            logger.exception(f"Unexpected error in verify_sdg_claims: {e}")
            raise
    
    async def get_verification_result(self, project_id: str) -> Dict[str, Any]:
        """
        Get verification results for a project
        
        Args:
            project_id: ID of the project
            
        Returns:
            Verification results
        """
        try:
            endpoint = f"{self.base_url}/verification/{project_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(endpoint, headers=self.headers) as response:
                    response.raise_for_status()
                    return await response.json()
                    
        except aiohttp.ClientError as e:
            logger.error(f"Error fetching verification result: {e}")
            return {
                "success": False,
                "message": f"Unable to fetch verification result: {str(e)}",
                "data": None
            }
    
    def _generate_mock_verification(
        self, company_name: str, project_name: str, sdg_claims: List[Dict]
    ) -> Dict[str, Any]:
        """
        Generate mock verification data for demonstration purposes
        """
        import random
        
        active_claims = [claim for claim in sdg_claims if claim.get("checked", False)]
        if not active_claims:
            return {
                "success": False,
                "message": "No active claims to verify",
                "data": None
            }
        
        results = []
        for claim in active_claims:
            # Generate random verification data
            score = random.randint(60, 95)
            confidence = "high" if score >= 80 else "medium" if score >= 50 else "low"
            
            results.append({
                "sdgId": claim.get("id") or claim.get("sdgId"),
                "verificationScore": score,
                "confidenceLevel": confidence,
                "evidenceFound": True,
                "evidenceSummary": f"[Mock] Analysis of {company_name}'s sustainability initiatives suggests {score}% alignment with their SDG {claim.get('id')} claim.",
                "sources": [
                    f"https://example.com/companies/{company_name}/sustainability",
                    f"https://example.com/sdg-database/{claim.get('id')}"
                ]
            })
        
        total_score = sum(r["verificationScore"] for r in results) / len(results)
        
        return {
            "success": True,
            "message": "Mock verification completed",
            "data": {
                "projectId": f"mock_{abs(hash(company_name + project_name)) % 10000}",
                "companyName": company_name,
                "totalScore": total_score,
                "verificationDate": datetime.now().isoformat(),
                "results": results
            }
        }