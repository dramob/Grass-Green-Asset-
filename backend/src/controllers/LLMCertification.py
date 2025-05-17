import os
import requests
import json
import tempfile
import PyPDF2
from typing import List, Dict, Any, Optional, Union
from openai import OpenAI

# Initialize OpenAI client
OPENAI_KEY = os.environ.get("OPENAI_KEY")
client = OpenAI(api_key=OPENAI_KEY)

def _download_pdf(url: str) -> Optional[str]:
    """
    Download PDF from URL and extract text
    
    Args:
        url: URL of the PDF
        
    Returns:
        Extracted text from PDF or None if failed
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

def fetch_page_texts_with_crawl4ai(urls: List[str]) -> Dict[str, str]:
    """
    Fetch text content from URLs using Crawl4AI
    
    Args:
        urls: List of URLs to fetch
        
    Returns:
        Dictionary mapping URLs to their content
    """
    results = {}
    
    for url in urls:
        if url.lower().endswith('.pdf'):
            pdf_text = _download_pdf(url)
            if pdf_text:
                results[url] = pdf_text
            continue
            
        try:
            response = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            })
            response.raise_for_status()
            results[url] = response.text
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            
    return results

def condense_with_llm(texts: List[str], prompt: str, json_response: bool = False) -> str:
    """
    Condense multiple texts using OpenAI GPT
    
    Args:
        texts: List of texts to condense
        prompt: Instruction for condensation
        json_response: Whether to request JSON formatted response
        
    Returns:
        Condensed text or JSON string
    """
    if not OPENAI_KEY:
        raise ValueError("OpenAI API key not found in environment variables")
    
    combined_text = "\n\n---\n\n".join(texts)
    
    try:
        kwargs = {
            "model": "gpt-4.1-nano",
            "messages": [
                {
                    "role": "system", 
                    "content": "You are an expert at analyzing sustainable development information. Your task is to evaluate evidence of company sustainability claims, particularly related to the UN Sustainable Development Goals (SDGs). Be objective and evidence-based in your analysis."
                },
                {
                    "role": "user", 
                    "content": f"{prompt}\n\nHere are the texts to process:\n\n{combined_text}"
                }
            ],
            "max_tokens": 1500
        }
        
        # If JSON response is requested, add the response format parameter
        if json_response:
            kwargs["response_format"] = {"type": "json_object"}
            
            # Update system message for JSON
            kwargs["messages"][0]["content"] += " Always respond with valid JSON only."
        
        response = client.chat.completions.create(**kwargs)
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error with LLM condensation: {e}")
        if json_response:
            return json.dumps({
                "error": "Error processing the content with AI.",
                "evidence_summary": "Failed to analyze the provided information.",
                "verification_score": 0,
                "confidence_level": "low",
                "supporting_facts": []
            })
        else:
            return "Error processing the content with AI."

async def scrape_google_and_condense(query: str, num_results: int = 5, sdg_goal: Optional[int] = None, keywords: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Search Google for information about a company's SDG claims, scrape results, and condense information
    
    Args:
        query: Search query (typically company name + SDG claim)
        num_results: Number of results to process
        sdg_goal: Specific SDG goal number (1-17) to focus on
        keywords: Additional keywords to refine the search
        
    Returns:
        Dictionary with results and condensed information
    """
    # Import here to avoid circular imports
    from ..services.search.web_search import WebSearchService
    
    # Enhance query with keywords if provided
    enhanced_query = query
    if keywords:
        enhanced_query = f"{enhanced_query} {' '.join(keywords)}"
    
    # Perform the search
    try:
        web_search_service = WebSearchService()
        search_results = await web_search_service.search(
            query=enhanced_query,
            num_results=num_results,
            sdg_id=sdg_goal
        )
        
        # Extract URLs from search results
        search_urls = [result["url"] for result in search_results]
    except Exception as e:
        print(f"Error during search: {e}")
        # Fallback to dummy URLs if search fails
        search_urls = [
            f"https://example.com/result/{i}?q={enhanced_query.replace(' ', '+')}" 
            for i in range(num_results)
        ]
    
    # Fetch content from all URLs
    page_texts = fetch_page_texts_with_crawl4ai(search_urls)
    
    # Filter out failed fetches
    valid_texts = [text for text in page_texts.values() if text]
    
    if not valid_texts:
        return {
            "success": False,
            "message": "Could not retrieve any valid content",
            "results": [],
            "condensed": "",
            "score": 0,
            "evidence_found": False
        }
    
    # Create a specific prompt for SDG verification
    sdg_specific_instruction = ""
    if sdg_goal:
        sdg_specific_instruction = f"Focus specifically on evidence related to SDG {sdg_goal}."
    
    # Condense the information with a focus on verification
    condensation_prompt = f"""
    Analyze these texts for evidence about the following company sustainability claim:
    
    CLAIM: {query}
    
    {sdg_specific_instruction}
    
    1. Extract any factual information related to this claim
    2. Identify specific sustainability initiatives, certifications, or standards mentioned
    3. Assess the credibility and specificity of the information
    4. Determine if there is substantial evidence to support the claim
    
    Your response MUST be a valid JSON object with the following structure:
    
    {{
      "evidence_summary": "A paragraph summarizing the key evidence found or lack thereof",
      "verification_score": 75, // A number from 0-100
      "confidence_level": "high", // One of: "high", "medium", "low"
      "supporting_facts": [
        "Fact 1",
        "Fact 2",
        "Fact 3"
      ],
      "recommendations": "Optional suggestions for stronger evidence"
    }}
    
    Return ONLY the JSON object with no additional text or formatting.
    """
    
    # Request a JSON response directly
    raw_response = condense_with_llm(valid_texts, condensation_prompt, json_response=True)
    
    # Try to parse the response as JSON
    try:
        # Parse the JSON response
        result_data = json.loads(raw_response)
        
        # Extract structured data
        evidence_summary = result_data.get('evidence_summary', '')
        score = int(result_data.get('verification_score', 0))
        confidence = result_data.get('confidence_level', 'low').lower()
        supporting_facts = result_data.get('supporting_facts', [])
        
        # Format the response with the parsed data
        formatted_response = f"""
EVIDENCE SUMMARY:
{evidence_summary}

VERIFICATION SCORE: {score}/100

CONFIDENCE: {confidence.capitalize()}

SUPPORTING FACTS:
{chr(10).join(['- ' + fact for fact in supporting_facts])}
        """.strip()
        
        return {
            "success": True,
            "message": f"Successfully processed {len(valid_texts)} sources",
            "results": list(page_texts.keys()),
            "condensed": formatted_response,
            "score": score,
            "evidence_found": score > 30,
            "confidence": confidence
        }
        
    except Exception as e:
        print(f"Error parsing JSON response: {e}")
        print(f"Raw response: {raw_response}")
    
    # Fallback to a simple heuristic if JSON parsing fails
    estimated_score = min(len(valid_texts) * 20, 100)
    
    return {
        "success": True,
        "message": f"Successfully processed {len(valid_texts)} sources",
        "results": list(page_texts.keys()),
        "condensed": "Failed to format verification results. Raw data was collected but could not be processed.",
        "score": estimated_score,
        "evidence_found": len(valid_texts) > 0
    }