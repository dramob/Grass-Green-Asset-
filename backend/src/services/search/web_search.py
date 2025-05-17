"""
Web search service for finding information about company SDG claims
"""

import os
import logging
import requests
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus
import json
from googlesearch import search as google_search
logger = logging.getLogger(__name__)

class WebSearchService:
    """Service for performing web searches"""
    
    def __init__(self, api_key=None, search_engine="google"):
        """
        Initialize the web search service
        
        Args:
            api_key: API key for search engine
            search_engine: Search engine to use ("brave", "google", etc.)
        """
        self.api_key = api_key
        self.search_engine = search_engine
        self.brave_search_url = "https://api.search.brave.com/res/v1/web/search"
    
    async def search(
        self, 
        query: str, 
        num_results: int = 10,
        sdg_id: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        Search the web for information
        
        Args:
            query: Search query
            num_results: Number of results to return
            sdg_id: Optional SDG ID to enhance the query
            
        Returns:
            List of search results (title, url, snippet)
        """
        # Enhance query with SDG information if provided
        enhanced_query = query
        if sdg_id:
            sdg_descriptions = {
                1: "no poverty",
                2: "zero hunger",
                3: "good health and well-being",
                4: "quality education",
                5: "gender equality",
                6: "clean water and sanitation",
                7: "affordable and clean energy",
                8: "decent work and economic growth",
                9: "industry innovation and infrastructure",
                10: "reduced inequalities",
                11: "sustainable cities and communities",
                12: "responsible consumption and production",
                13: "climate action",
                14: "life below water",
                15: "life on land",
                16: "peace justice and strong institutions",
                17: "partnerships for the goals"
            }
            sdg_term = sdg_descriptions.get(sdg_id, f"SDG {sdg_id}")
            enhanced_query = f"{query} {sdg_term} sustainability"
        
        try:
            # Try to use real Google search
            if self.search_engine == "google":
                return await self._google_search(enhanced_query, num_results)
            elif self.search_engine == "brave" and self.api_key:
                return await self._brave_search(enhanced_query, num_results)
            else:
                # Fallback to mock results if no valid search engine configuration
                logger.warning("Using mock search results due to invalid search configuration")
                return self._generate_mock_results(query, num_results, sdg_id)
        except Exception as e:
            logger.error(f"Search error: {e}")
            logger.info("Falling back to mock results")
            return self._generate_mock_results(query, num_results, sdg_id)
    
    async def _google_search(self, query: str, num_results: int = 10) -> List[Dict[str, str]]:
        """
        Perform a Google search using googlesearch-python
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of search results
        """
        try:
            results = []
            # Using googlesearch-python to get search results
            # The pause parameter helps prevent being blocked by Google (in seconds)
            for url in google_search(query, num_results=num_results, pause=2.0):
                # For real implementation, we would fetch the page title and snippet
                # Here we'll just create a basic record with the URL
                results.append({
                    "title": url.split("/")[-1].replace("-", " ").capitalize(),
                    "url": url,
                    "snippet": f"Search result for '{query}' - {url}"
                })
                
                if len(results) >= num_results:
                    break
                    
            return results
        except Exception as e:
            logger.error(f"Google search error: {e}")
            raise
    
    async def _brave_search(self, query: str, num_results: int = 10) -> List[Dict[str, str]]:
        """
        Perform a search using Brave Search API
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of search results
        """
        try:
            params = {
                "q": query,
                "count": min(num_results, 20)  # Brave API limit
            }
            
            headers = {
                "Accept": "application/json",
                "X-Subscription-Token": self.api_key
            }
            
            response = requests.get(self.brave_search_url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            for web_result in data.get("web", {}).get("results", []):
                results.append({
                    "title": web_result.get("title", ""),
                    "url": web_result.get("url", ""),
                    "snippet": web_result.get("description", "")
                })
                
            return results[:num_results]
        except Exception as e:
            logger.error(f"Brave search error: {e}")
            raise
    
    def _generate_mock_results(
        self, 
        query: str, 
        num_results: int = 10,
        sdg_id: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        Generate mock search results for development
        
        Args:
            query: Search query
            num_results: Number of results to return
            sdg_id: Optional SDG ID to customize results
            
        Returns:
            List of mock search results
        """
        # Extract company name from query (usually the first few words)
        query_parts = query.split()
        company_name = " ".join(query_parts[:2]) if len(query_parts) > 1 else query
        
        # Create normalized company name for URLs
        company_slug = company_name.lower().replace(" ", "-")
        
        # Generate domain variations
        domains = [
            f"{company_slug}.com",
            "sustainabledevelopmentreport.org",
            "sdgs.un.org",
            "unglobalcompact.org",
            "sustainability-reports.com",
            "esg-reporting.org",
            "greenbiz.com",
            "sustainablebrands.com",
            "csrwire.com"
        ]
        
        # Customize some results based on SDG ID if provided
        sdg_specific_results = []
        if sdg_id:
            sdg_descriptions = {
                1: "no poverty",
                2: "zero hunger",
                3: "good health and well-being",
                4: "quality education",
                5: "gender equality",
                6: "clean water and sanitation",
                7: "affordable and clean energy",
                8: "decent work and economic growth",
                9: "industry innovation and infrastructure",
                10: "reduced inequalities",
                11: "sustainable cities and communities",
                12: "responsible consumption and production",
                13: "climate action",
                14: "life below water",
                15: "life on land",
                16: "peace justice and strong institutions",
                17: "partnerships for the goals"
            }
            
            sdg_title = sdg_descriptions.get(sdg_id, f"SDG {sdg_id}")
            
            sdg_specific_results = [
                {
                    "title": f"{company_name} {sdg_title.title()} Initiative",
                    "url": f"https://{company_slug}.com/sustainability/sdg-{sdg_id}",
                    "snippet": f"{company_name} has committed to supporting {sdg_title} through various initiatives. Our latest sustainability report details our progress toward achieving this goal."
                },
                {
                    "title": f"UN Global Compact: {company_name} SDG {sdg_id} Commitment",
                    "url": f"https://unglobalcompact.org/what-is-gc/participants/{company_slug}/sdg{sdg_id}",
                    "snippet": f"As a member of the UN Global Compact, {company_name} has outlined specific targets related to SDG {sdg_id} - {sdg_title}."
                }
            ]
        
        # Generate generic results
        generic_results = [
            {
                "title": f"{company_name} - Sustainability Report 2023",
                "url": f"https://{company_slug}.com/sustainability/report-2023",
                "snippet": f"{company_name}'s latest sustainability report outlines our commitment to the UN Sustainable Development Goals and details our environmental, social, and governance (ESG) performance."
            },
            {
                "title": f"{company_name} Sets Science-Based Targets for Carbon Reduction",
                "url": f"https://sustainablebrands.com/read/{company_slug}-carbon-targets",
                "snippet": f"{company_name} has announced new science-based targets for reducing greenhouse gas emissions across its operations and supply chain."
            },
            {
                "title": f"ESG Rating Report: {company_name}",
                "url": f"https://esg-reporting.org/companies/{company_slug}",
                "snippet": f"This comprehensive ESG rating report analyzes {company_name}'s performance on environmental, social, and governance factors relative to industry peers."
            }
        ]
        
        # Combine and limit results
        all_results = sdg_specific_results + generic_results
        
        # Generate additional results if needed
        while len(all_results) < num_results:
            index = len(all_results)
            domain = domains[index % len(domains)]
            path = f"sustainability/initiative-{index}"
            
            all_results.append({
                "title": f"{company_name} Sustainability Initiative {index}",
                "url": f"https://{domain}/{path}",
                "snippet": f"{company_name} continues to demonstrate its commitment to sustainability through various programs and initiatives aimed at creating long-term value."
            })
        
        return all_results[:num_results]