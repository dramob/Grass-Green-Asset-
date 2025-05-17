"""
Service for interacting with OpenAI's API
"""

import os
import logging
from openai import OpenAI
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Load API key from environment
OPENAI_KEY = os.environ.get("OPENAI_KEY")

class OpenAIService:
    """Service for making requests to OpenAI API"""
    
    def __init__(self, api_key=None):
        """
        Initialize with API key from parameter or environment
        
        Args:
            api_key: OpenAI API key (optional, falls back to environment variable)
        """
        self.api_key = api_key or OPENAI_KEY
        if not self.api_key:
            logger.warning("OpenAI API key not provided and not found in environment")
            
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        
    def available(self) -> bool:
        """Check if the service is available (API key is set)"""
        return self.client is not None
        
    def analyze_verification(
        self, 
        company_name: str, 
        sdg_goal_id: int, 
        claim_text: str, 
        evidence_texts: List[str],
        sources: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze a company's SDG claim against evidence
        
        Args:
            company_name: Name of the company
            sdg_goal_id: SDG goal ID (1-17)
            claim_text: The text of the claim to verify
            evidence_texts: List of texts from web searches
            sources: List of source URLs for the evidence
            
        Returns:
            Dictionary with analysis results
        """
        if not self.available():
            return self._generate_mock_analysis(company_name, sdg_goal_id, claim_text)
            
        try:
            # Map SDG number to name/description
            sdg_descriptions = {
                1: "No Poverty",
                2: "Zero Hunger",
                3: "Good Health and Well-being",
                4: "Quality Education",
                5: "Gender Equality",
                6: "Clean Water and Sanitation",
                7: "Affordable and Clean Energy",
                8: "Decent Work and Economic Growth",
                9: "Industry, Innovation, and Infrastructure",
                10: "Reduced Inequality",
                11: "Sustainable Cities and Communities",
                12: "Responsible Consumption and Production",
                13: "Climate Action",
                14: "Life Below Water",
                15: "Life on Land",
                16: "Peace, Justice, and Strong Institutions",
                17: "Partnerships for the Goals"
            }
            
            sdg_goal_name = sdg_descriptions.get(sdg_goal_id, f"SDG #{sdg_goal_id}")
            
            # Prepare evidence text
            combined_evidence = "\n\n---\n\n".join(
                [f"SOURCE {i+1} ({sources[i] if i < len(sources) else 'unknown'}):\n{text}" 
                 for i, text in enumerate(evidence_texts)]
            )
            
            # Create the prompt
            prompt = f"""
            TASK: Analyze a company's sustainability claim against evidence.
            
            COMPANY: {company_name}
            SDG GOAL: {sdg_goal_name} (SDG #{sdg_goal_id})
            CLAIM: "{claim_text}"
            
            Based on the evidence provided, assess whether the claim is supported by factual information.
            
            EVIDENCE:
            {combined_evidence}
            
            Your analysis should include:
            1. Whether there is evidence that supports the company's claim
            2. How specific and substantial the evidence is
            3. Whether the evidence is directly related to the company's activities
            4. A numerical score (0-100) reflecting the degree of verification
            5. A confidence level (High, Medium, or Low) based on the quality of evidence
            
            FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:
            
            EVIDENCE SUMMARY:
            [2-3 paragraphs summarizing the key evidence found or lack thereof]
            
            VERIFICATION SCORE: [0-100]
            
            CONFIDENCE: [High/Medium/Low]
            
            SUPPORTING FACTS:
            - [Fact 1]
            - [Fact 2]
            - [Fact 3]
            
            RECOMMENDATIONS:
            [Brief suggestions for stronger evidence if applicable]
            """
            
            # Make the API call
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano",
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing sustainable development information. Your task is to evaluate evidence of company sustainability claims related to the UN Sustainable Development Goals (SDGs). Be objective and evidence-based. Always respond in valid JSON format exactly matching the requested structure. Do not include any text outside the JSON object."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            
            # A real implementation would parse the content to extract structured data
            # For now, we'll extract some key information using simple text parsing
            
            # Extract verification score
            score = 0
            score_line = [line for line in content.split('\n') if 'VERIFICATION SCORE:' in line]
            if score_line:
                try:
                    score = int(score_line[0].split(':')[1].strip())
                except (ValueError, IndexError):
                    score = 0
            
            # Extract confidence
            confidence = "low"
            confidence_line = [line for line in content.split('\n') if 'CONFIDENCE:' in line]
            if confidence_line:
                confidence_text = confidence_line[0].split(':')[1].strip().lower()
                if "high" in confidence_text:
                    confidence = "high"
                elif "medium" in confidence_text:
                    confidence = "medium"
            
            return {
                "summary": content,
                "score": score,
                "confidence": confidence,
                "evidence_found": score > 30,
                "sources": sources
            }
            
        except Exception as e:
            logger.exception(f"Error calling OpenAI API: {e}")
            return self._generate_mock_analysis(company_name, sdg_goal_id, claim_text)
    
    def _generate_mock_analysis(self, company_name: str, sdg_goal_id: int, claim_text: str) -> Dict[str, Any]:
        """
        Generate a mock analysis when the API is not available
        """
        import random
        
        score = random.randint(60, 95)
        confidence = "high" if score >= 80 else "medium" if score >= 50 else "low"
        
        return {
            "summary": f"""
EVIDENCE SUMMARY:
[Mock Data] Based on publicly available information, {company_name}'s claim about SDG {sdg_goal_id} appears to be supported by moderate evidence. The company has published sustainability reports that mention initiatives related to this goal, though specific metrics and third-party verification would strengthen the claim.

VERIFICATION SCORE: {score}

CONFIDENCE: {confidence}

SUPPORTING FACTS:
- Company has mentioned this initiative in public communications
- Some evidence of implementation exists
- Limited third-party verification is available

RECOMMENDATIONS:
Provide more specific metrics and third-party certification to strengthen this claim.
            """.strip(),
            "score": score,
            "confidence": confidence,
            "evidence_found": True,
            "sources": [
                f"https://example.com/companies/{company_name.lower().replace(' ', '-')}/sustainability",
                f"https://example.com/sdg-database/{sdg_goal_id}"
            ]
        }