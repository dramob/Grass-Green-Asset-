"""
FastAPI endpoints for XRPL oracle price data
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import asyncio
import sys
from pathlib import Path
import json
import os
import time
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import oracle service
from services.xrpl.oracle_service import (
    get_carbon_price_usd,
    get_xrp_usd,
    TOKEN_CODE,
    WSS
)

# Create router
router = APIRouter(
    prefix="/api/oracle",
    tags=["oracle"],
    responses={404: {"description": "Not found"}},
)

# Models
class PriceResponse(BaseModel):
    success: bool
    token_code: str = TOKEN_CODE
    price_xrp: Optional[float] = None
    price_usd: Optional[float] = None
    xrp_usd_rate: Optional[float] = None
    timestamp: str
    message: Optional[str] = None

class HistoricalPrice(BaseModel):
    timestamp: str
    price_xrp: float
    price_usd: float
    xrp_usd_rate: float

class PriceHistoryResponse(BaseModel):
    success: bool
    token_code: str = TOKEN_CODE
    prices: List[HistoricalPrice] = []
    message: Optional[str] = None

# In-memory price cache with 30-minute TTL
price_cache = {
    "last_update": None,
    "price_xrp": None,
    "price_usd": None,
    "xrp_usd_rate": None
}

# Historical prices (in-memory for simplicity; in production use a database)
PRICE_HISTORY_MAX_ITEMS = 100
price_history = []

async def get_current_prices(force_refresh=False):
    """Get current token prices from oracle or cache"""
    global price_cache
    
    # Check if cache is valid (less than 30 minutes old)
    cache_valid = (
        price_cache["last_update"] is not None and
        (datetime.now() - price_cache["last_update"]) < timedelta(minutes=30) and
        not force_refresh
    )
    
    if cache_valid:
        return {
            "price_xrp": price_cache["price_xrp"],
            "price_usd": price_cache["price_usd"],
            "xrp_usd_rate": price_cache["xrp_usd_rate"]
        }
    
    # Fetch fresh prices
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            # Get carbon credit price in USD and XRP/USD rate
            carbon_usd = await get_carbon_price_usd(session)
            xrp_usd_rate = await get_xrp_usd(session)
            
            # Calculate GRASS/XRP price
            price_xrp = carbon_usd / xrp_usd_rate
            
            # Update cache
            price_cache = {
                "last_update": datetime.now(),
                "price_xrp": price_xrp,
                "price_usd": carbon_usd,
                "xrp_usd_rate": xrp_usd_rate
            }
            
            # Add to history
            add_price_to_history(price_xrp, carbon_usd, xrp_usd_rate)
            
            return {
                "price_xrp": price_xrp,
                "price_usd": carbon_usd,
                "xrp_usd_rate": xrp_usd_rate
            }
    except Exception as e:
        # If fetching fails, return cached values if available
        if price_cache["last_update"] is not None:
            return {
                "price_xrp": price_cache["price_xrp"],
                "price_usd": price_cache["price_usd"],
                "xrp_usd_rate": price_cache["xrp_usd_rate"]
            }
        raise e

def add_price_to_history(price_xrp, price_usd, xrp_usd_rate):
    """Add current price to history"""
    global price_history
    
    # Add new price point
    price_history.append({
        "timestamp": datetime.now().isoformat(),
        "price_xrp": price_xrp,
        "price_usd": price_usd,
        "xrp_usd_rate": xrp_usd_rate
    })
    
    # Trim history if too large
    if len(price_history) > PRICE_HISTORY_MAX_ITEMS:
        price_history = price_history[-PRICE_HISTORY_MAX_ITEMS:]

@router.get("/price", response_model=PriceResponse)
async def get_token_price(force_refresh: bool = False):
    """
    Get the current price of GRASS tokens from the oracle
    """
    try:
        prices = await get_current_prices(force_refresh)
        
        return PriceResponse(
            success=True,
            token_code=TOKEN_CODE,
            price_xrp=prices["price_xrp"],
            price_usd=prices["price_usd"],
            xrp_usd_rate=prices["xrp_usd_rate"],
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        return PriceResponse(
            success=False,
            timestamp=datetime.now().isoformat(),
            message=f"Failed to get token price: {str(e)}"
        )

@router.get("/history", response_model=PriceHistoryResponse)
async def get_price_history(days: int = 7):
    """
    Get historical token prices
    """
    try:
        # Ensure we have some price data
        if not price_history:
            # Get current price to populate history
            await get_current_prices(force_refresh=True)
        
        # Filter history by date if needed
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_history = [
            price for price in price_history
            if datetime.fromisoformat(price["timestamp"]) >= cutoff_date
        ]
        
        return PriceHistoryResponse(
            success=True,
            token_code=TOKEN_CODE,
            prices=filtered_history
        )
    except Exception as e:
        return PriceHistoryResponse(
            success=False,
            message=f"Failed to get price history: {str(e)}"
        )

@router.get("/xrpl-connection")
async def get_xrpl_connection_info():
    """
    Get information about the XRPL connection
    """
    return {
        "success": True,
        "network": WSS,
        "timestamp": datetime.now().isoformat()
    }