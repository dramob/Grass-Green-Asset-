import os
import requests
import json
import tempfile
import PyPDF2
from typing import List, Dict, Any, Optional, Union
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque

# Constants
MODEL_ENDPOINT_NAME = "gpt-4.1-nano"
ENDPOINT_URL = "https://api.openai.com/v1/chat/completions"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.environ.get('OPENAI_KEY')}"
}

# Define the function calling tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "scrape_brave_and_condense",
            "description": "Search the web and fetch content related to the query, returning raw results for analysis",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query (company name, topic, etc.)"},
                    "num_results": {"type": "integer", "default": 5, "description": "Number of search results to process"},
                    "keywords": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Additional keywords to prioritize during crawling"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

def _download_pdf(url: str) -> Optional[str]:
    """
    Download PDF from URL and extract text
    """
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            for chunk in response.iter_content(chunk_size=1024):
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        text = ""
        with open(temp_file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                text += pdf_reader.pages[page_num].extract_text()
        
        os.unlink(temp_file_path)
        return text
    except Exception as e:
        print(f"Error downloading or processing PDF: {e}")
        return None

def fetch_page_texts(
    urls: List[str],
    keywords: Optional[List[str]] = None,
    max_depth: int = 1,
    max_pages: int = 3
) -> Dict[str, str]:
    """
    Fetch and crawl text content from URLs
    """
    results: Dict[str, str] = {}
    visited: set[str] = set()
    queue = deque([(u, 0) for u in urls])
    pages_crawled = 0

    while queue and pages_crawled < max_pages:
        current_url, depth = queue.popleft()
        if current_url in visited or depth > max_depth:
            continue
        visited.add(current_url)

        text = None
        if current_url.lower().endswith('.pdf'):
            text = _download_pdf(current_url)
        else:
            try:
                resp = requests.get(
                    current_url,
                    headers={
                        "User-Agent": (
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/91.0.4472.124 Safari/537.36"
                        )
                    }
                )
                resp.raise_for_status()
                text = resp.text
            except Exception as e:
                print(f"Error fetching {current_url}: {e}")
        if not text:
            continue

        results[current_url] = text
        pages_crawled += 1

        # Enqueue links for further crawling if needed
        if depth < max_depth:
            try:
                base_domain = urlparse(current_url).netloc
                soup = BeautifulSoup(text, 'html.parser')
                for a in soup.find_all('a', href=True):
                    link = urljoin(current_url, a['href'])
                    parsed = urlparse(link)
                    # restrict to same domain
                    if parsed.netloc != base_domain:
                        continue
                    # filter by keywords if provided
                    if keywords:
                        txt = a.get_text(separator=' ', strip=True)
                        if not any(kw.lower() in txt.lower() or kw.lower() in link.lower() for kw in keywords):
                            continue
                    if link not in visited:
                        queue.append((link, depth + 1))
            except Exception as e:
                print(f"Error parsing links: {e}")

    return results

def extract_content_from_html(html: str) -> str:
    """
    Extract readable content from HTML
    """
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
        
        # Get text
        text = soup.get_text(separator=' ', strip=True)
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
    except Exception as e:
        print(f"Error extracting content: {e}")
        return html[:5000]  # Return truncated HTML if extraction fails

async def scrape_brave_and_condense(
    query: str,
    num_results: int = 5,
    keywords: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Search the web for information, fetch content, and return it for the LLM to process
    
    Args:
        query: Search query
        num_results: Number of results to process
        keywords: Additional keywords to prioritize during crawling
    
    Returns:
        Dictionary with the fetched content and metadata
    """
    # Build the search query
    search_query = query
    if keywords:
        additional_terms = " ".join(keywords)
        search_query = f"{search_query} {additional_terms}"
    
    # Use a search API to get the initial URLs
    # This is a placeholder - replace with your actual search API implementation
    search_api_key = os.environ.get("SEARCH_API_KEY")
    search_urls = []
    
    try:
        # Example using a generic search API
        search_url = f"https://api.search.com/search?q={search_query.replace(' ', '+')}&n={num_results}&key={search_api_key}"
        response = requests.get(search_url)
        response.raise_for_status()
        search_data = response.json()
        
        # Extract URLs from search results
        for result in search_data.get("results", []):
            if "url" in result:
                search_urls.append(result["url"])
        
        # Limit to requested number
        search_urls = search_urls[:num_results]
    except Exception as e:
        print(f"Error performing search: {e}")
        # Fallback to empty list if search fails
        search_urls = []
    
    # If search failed, return empty results
    if not search_urls:
        return {
            "success": False,
            "message": "Failed to retrieve search results",
            "content": [],
            "metadata": {
                "query": query,
                "keywords": keywords or []
            }
        }
    
    # Fetch and crawl content from the URLs
    raw_page_content = fetch_page_texts(
        search_urls,
        keywords=keywords,
        max_depth=1,  # Keep it simple - just the initial pages
        max_pages=num_results
    )
    
    # Extract readable content from the raw HTML
    processed_content = []
    for url, html in raw_page_content.items():
        text = extract_content_from_html(html)
        
        # Truncate long content to a reasonable size
        if len(text) > 10000:
            text = text[:10000] + "... [content truncated]"
        
        processed_content.append({
            "url": url,
            "content": text,
            "title": extract_title(html),
            "snippet": text[:200] + "..." if len(text) > 200 else text
        })
    
    return {
        "success": True,
        "message": f"Retrieved content from {len(processed_content)} sources",
        "content": processed_content,
        "metadata": {
            "query": query,
            "keywords": keywords or [],
            "num_sources": len(processed_content)
        }
    }

def extract_title(html: str) -> str:
    """Extract the title from HTML content"""
    try:
        soup = BeautifulSoup(html, 'html.parser')
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text(strip=True)
        h1_tag = soup.find('h1')
        if h1_tag:
            return h1_tag.get_text(strip=True)
        return "Untitled"
    except:
        return "Untitled"

async def get_company_info(form_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get comprehensive information about a company using LLM and web search.
    
    Args:
        form_data: Dictionary containing form data including company_name
        
    Returns:
        Dictionary containing company information
    """
    company_name = form_data.get("company_name", "")
    industry = form_data.get("industry", "")
    focus_areas = form_data.get("focus_areas", [])
    
    if not company_name:
        return {
            "success": False,
            "message": "Company name is required",
            "data": None
        }
    
    # Prepare the query
    query = f"{company_name}"
    if industry:
        query += f" {industry}"
    
    # Prepare the message for the LLM
    messages = [
        {
            "role": "system",
            "content": (
                "You are a research assistant specializing in verifying claims made in form submissions, "
                "especially regarding sustainability and SDGs (Sustainable Development Goals). "
                "When needed, use the scrape_brave_and_condense function to find relevant information."
            )
        },
        {
            "role": "user",
            "content": (
                f"Given the following form data:\n{json.dumps(form_data, indent=2)}\n\n"
                "For each SDG mentioned or implied, provide a score from 0 (no evidence) to 10 (strong evidence) "
                "on how well the claims are supported by available information. "
                "List each SDG, the score, and a brief justification. "
                "Use web search to gather the most up-to-date information to back or refute the claims."
            )
        }
    ]
    
    # Prepare the API call payload
    payload = {
        "model": MODEL_ENDPOINT_NAME,
        "messages": messages,
        "tools": tools,
        "tool_choice": "auto",
        "temperature": 0.2,
    }
    
    try:
        # Make the initial API call to the LLM
        response = requests.post(ENDPOINT_URL, headers=HEADERS, json=payload)
        response.raise_for_status()
        response_data = response.json()
        
        # Extract the LLM's response
        choice = response_data.get("choices", [{}])[0]
        message = choice.get("message", {})
        
        # Check if the LLM is calling a tool
        tool_calls = message.get("tool_calls", [])
        
        if not tool_calls:
            # LLM responded without using a tool
            return {
                "success": True,
                "message": "LLM provided information without web search",
                "data": {
                    "company_name": company_name,
                    "analysis": message.get("content", "No information provided")
                }
            }
        
        # Process the tool calls
        all_content = []
        for tool_call in tool_calls:
            function = tool_call.get("function", {})
            name = function.get("name")
            
            if name == "scrape_brave_and_condense":
                # Parse the arguments
                arguments = json.loads(function.get("arguments", "{}"))
                search_query = arguments.get("query", query)
                search_keywords = arguments.get("keywords", focus_areas)
                search_num_results = arguments.get("num_results", 5)
                
                # Execute the function
                search_result = await scrape_brave_and_condense(
                    query=search_query,
                    keywords=search_keywords,
                    num_results=search_num_results
                )
                
                # Add the content to our collection
                if search_result.get("success"):
                    all_content.extend(search_result.get("content", []))
        
        # Now feed the collected information back to the LLM for analysis
        if all_content:
            # Prepare concise sources to send back to the LLM
            sources_text = ""
            for i, source in enumerate(all_content, 1):
                sources_text += f"\nSOURCE {i}:\nURL: {source['url']}\nTITLE: {source['title']}\n"
                sources_text += f"CONTENT SNIPPET: {source['snippet']}\n"
                # Add full content for first few sources only to avoid token limits
                if i <= 3:
                    sources_text += f"FULL CONTENT: {source['content'][:3000]}...\n"
            
            # Create a follow-up message with the sources
            messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": tool_calls
            })
            
            messages.append({
                "role": "tool",
                "tool_call_id": tool_calls[0]["id"],
                "content": json.dumps({"sources": sources_text})
            })
            
            messages.append({
                "role": "user",
                "content": "Based on the information you've gathered, please provide a comprehensive analysis of the company."
            })
            
            # Make the second API call for the final analysis
            final_payload = {
                "model": MODEL_ENDPOINT_NAME,
                "messages": messages,
                "temperature": 0.2,
            }
            
            final_response = requests.post(ENDPOINT_URL, headers=HEADERS, json=final_payload)
            final_response.raise_for_status()
            final_data = final_response.json()
            
            final_content = final_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            return {
                "success": True,
                "message": "Successfully gathered and analyzed company information",
                "data": {
                    "company_name": company_name,
                    "industry": industry,
                    "focus_areas": focus_areas,
                    "analysis": final_content,
                    "sources": [{"url": source["url"], "title": source["title"]} for source in all_content]
                }
            }
        else:
            # No content was gathered
            return {
                "success": False,
                "message": "Failed to gather relevant information",
                "data": {
                    "company_name": company_name,
                    "analysis": "No information could be retrieved for this company."
                }
            }
            
    except Exception as e:
        print(f"Error in get_company_info: {e}")
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "data": None
        }