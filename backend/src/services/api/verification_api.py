from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
import uvicorn

# Import your get_company_info function here
from src.controllers.LLMCertification import get_company_info

app = FastAPI()

class CompanyInfoRequest(BaseModel):
    company_name: str
    industry: str = ""
    focus_areas: list[str] = []

@app.post("/company-info")
async def company_info(request: CompanyInfoRequest) -> Dict[str, Any]:
    result = await get_company_info(request.dict())
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

# If running directly, start the server
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
