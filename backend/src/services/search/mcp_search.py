"""
MCP-based web search service for finding information about company SDG claims
"""

import os
import logging
import json
import requests
from typing import List, Dict, Any, Optional
import aiohttp

logger = logging.getLogger(__name__)

class MCPSearchService:
    """Service for performing web searches using MCP configuration"""
    
    def __init__(self):
        """Initialize the MCP search service"""
        self._load_config()
    
    def _load_config(self):
        """Load MCP configuration from config.mcp.json"""
        try:
            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), 'config.mcp.json')
            
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            brave_config = config.get('services', {}).get('braveSearch', {})
            self.api_key = brave_config.get('apiKey')
            self.endpoint = brave_config.get('endpoint', 'https://api.search.brave.com/res/v1/web/search')
            self.max_results = brave_config.get('maxResults', 10)
            self.timeout = brave_config.get('timeout', 30000)
            
            logger.info(f"Loaded MCP configuration: endpoint={self.endpoint}, max_results={self.max_results}")
            
            if not self.api_key:
                logger.warning("No Brave Search API key found in MCP configuration")
        except Exception as e:
            logger.error(f"Error loading MCP configuration: {e}")
            self.api_key = None
            self.endpoint = "https://api.search.brave.com/res/v1/web/search"
            self.max_results = 10
            self.timeout = 30000
    
    async def search(
        self, 
        query: str, 
        num_results: int = None,
        sdg_id: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        Search the web for information using Brave Search MCP
        
        Args:
            query: Search query
            num_results: Number of results to return
            sdg_id: Optional SDG ID to enhance the query
            
        Returns:
            List of search results (title, url, snippet)
        """
        if num_results is None:
            num_results = self.max_results
            
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
            
        logger.info(f"Performing MCP search for: {enhanced_query}")
        
        if not self.api_key:
            logger.warning("No Brave Search API key available, using mock results")
            from web_search import WebSearchService
            mock_service = WebSearchService()
            return mock_service._generate_mock_results(query, num_results, sdg_id)
            
        try:
            return await self._brave_search_mcp(enhanced_query, num_results)
        except Exception as e:
            logger.error(f"MCP search error: {e}")
            logger.info("Falling back to mock results")
            from web_search import WebSearchService
            mock_service = WebSearchService()
            return mock_service._generate_mock_results(query, num_results, sdg_id)
    
    async def _brave_search_mcp(self, query: str, num_results: int) -> List[Dict[str, str]]:
        """
        Perform a search using Brave Search MCP API
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of search results
        """
        params = {
            "q": query,
            "count": min(num_results, 20)  # Brave API limit
        }
        
        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": self.api_key
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self.endpoint, 
                params=params, 
                headers=headers, 
                timeout=self.timeout/1000
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Brave search API error: {response.status} - {error_text}")
                    raise Exception(f"Brave search API error: {response.status}")
                
                data = await response.json()
                results = []
                
                for web_result in data.get("web", {}).get("results", []):
                    results.append({
                        "title": web_result.get("title", ""),
                        "url": web_result.get("url", ""),
                        "snippet": web_result.get("description", "")
                    })
                    
                return results[:num_results]