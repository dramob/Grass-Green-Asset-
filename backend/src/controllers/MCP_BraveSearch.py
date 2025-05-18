"""
MCP-based Brave search handler
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

def load_mcp_config() -> Dict[str, Any]:
    """Load the MCP configuration from config.mcp.json"""
    try:
        config_path = Path(__file__).parent.parent.parent.parent / "config.mcp.json"
        
        if not config_path.exists():
            logger.warning(f"MCP config file not found at {config_path}")
            return {}
        
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        return config
    except Exception as e:
        logger.error(f"Error loading MCP config: {e}")
        return {}

def get_brave_search_config() -> Dict[str, Any]:
    """Get the Brave search configuration from MCP config"""
    config = load_mcp_config()
    return config.get('services', {}).get('braveSearch', {})

def mcp_brave_search(query: str, *, num_results: int = 6) -> List[Dict[str, str]]:
    """
    Query Brave Search using MCP config and return [{url, title, description}]
    """
    config = get_brave_search_config()
    api_key = config.get('apiKey') or os.getenv("BRAVE_API_KEY")
    
    if not api_key:
        logger.warning("No Brave Search API key found in MCP config or environment variable")
        return []
    
    import requests
    
    endpoint = config.get('endpoint', "https://api.search.brave.com/res/v1/web/search")
    timeout = config.get('timeout', 30000) / 1000  # Convert to seconds
    
    params = {"q": query, "count": min(num_results, 20), "source": "news"}
    headers = {"X-Subscription-Token": api_key}
    
    try:
        r = requests.get(endpoint, params=params, headers=headers, timeout=timeout)
        r.raise_for_status()
        data = r.json()
        
        results = []
        for item in data.get("web", {}).get("results", []):
            results.append({
                "url": item.get("url", ""),
                "title": item.get("title", "Untitled"),
                "description": item.get("description", ""),
            })
        
        return results
    except Exception as e:
        logger.error(f"Brave search API error: {e}")
        return []