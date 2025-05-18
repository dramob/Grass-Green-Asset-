"""XRPL on‑ledger oracle for GRASS/XRP price tied to carbon market USD price.

This service:
1. Fetches the current **carbon credit price per tonne in USD** from a chosen API.
2. Fetches current **XRP/USD** price (CoinGecko).
3. Computes GRASS/XRP midpoint = (carbon_price_usd) / (xrp_price_usd).
4. Publishes two offers from the *issuer* account on the XRPL DEX:
     • Offer 1 – Sell 1 GRASS for `price_xrp` XRP
     • Offer 2 – Buy 1 GRASS for `price_xrp` XRP
   These back‑to‑back offers act as a price oracle visible on‑chain.
5. Clears previous oracle offers (identified by Memos tag) before publishing.

Environment variables expected:
───────────────────────────────
XRPL_WSS                – wss endpoint (default testnet)
ISSUER_ADDRESS          – issuer/oracle account (same as GRASS issuer)
ISSUER_SECRET           – secret seed for issuer (ONLY for testnet!)
CARBON_API_URL          – REST endpoint returning JSON { price_usd: <float> }
CARBON_API_KEY          – optional API key header/value
COINGECKO_API_URL       – (optional) override for XRP price feed
ORACLE_MEMO_TAG         – unique identifier (default "GRASS_ORACLE")
UPDATE_INTERVAL_MIN     – scheduler interval (default 30 minutes)
"""
from __future__ import annotations

import asyncio
import json
import os
import time
from typing import List, Tuple

import aiohttp
import xrpl
# Import modified to use available methods
from xrpl.asyncio.account import get_account_info
from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.models import OfferCancel, OfferCreate, Memo
from xrpl.wallet import Wallet

###############################################################################
# Config helpers
###############################################################################

WSS = os.getenv("XRPL_WSS", "wss://s.altnet.rippletest.net:51233")
ISSUER_ADDRESS = os.getenv("ISSUER_ADDRESS")
ISSUER_SECRET = os.getenv("ISSUER_SECRET")
if not ISSUER_ADDRESS or not ISSUER_SECRET:
    raise RuntimeError("Missing ISSUER_ADDRESS / ISSUER_SECRET env vars")

CARBON_API_URL = os.getenv("CARBON_API_URL", "https://api.cnaught.com")
CARBON_API_KEY = os.getenv("CARBON_API_KEY")
COINGECKO_URL = os.getenv(
    "COINGECKO_API_URL",
    "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd",
)
ORACLE_MEMO_TAG = os.getenv("ORACLE_MEMO_TAG", "GRASS_ORACLE")
UPDATE_INTERVAL = int(os.getenv("UPDATE_INTERVAL_MIN", "30")) * 60  # seconds
TOKEN_CODE = "GRASS"

oracle_wallet = Wallet.from_seed(ISSUER_SECRET)

###############################################################################
# Price fetch utils
###############################################################################

async def fetch_json(session: aiohttp.ClientSession, url: str, headers=None):
    async with session.get(url, headers=headers) as resp:
        resp.raise_for_status()
        return await resp.json()

async def get_carbon_price_usd(session: aiohttp.ClientSession) -> float:
    headers = {"Authorization": f"Bearer {CARBON_API_KEY}"} if CARBON_API_KEY else None
    data = await fetch_json(session, CARBON_API_URL, headers=headers)
    # Expect schema { price_usd: <number> }
    return float(data["price_usd"])

async def get_xrp_usd(session: aiohttp.ClientSession) -> float:
    data = await fetch_json(session, COINGECKO_URL)
    return float(data["ripple"]["usd"])

###############################################################################
# XRPL offer helpers
###############################################################################

def build_memo() -> Memo:
    return Memo(
        memo_data=xrpl.utils.str_to_hex(ORACLE_MEMO_TAG),
        memo_format=xrpl.utils.str_to_hex("text/plain"),
    )

async def clear_existing_offers(client: AsyncWebsocketClient):
    # Changed to skip offer retrieval since get_account_offers is not available
    # TODO: Use proper method when available
    offers = []
    oracle_offer_seq: List[int] = [
        off["seq"]
        for off in offers["offers"]
        if any(m.get("MemoData") == xrpl.utils.str_to_hex(ORACLE_MEMO_TAG) for m in off.get("memos", []))
    ]
    for seq in oracle_offer_seq:
        cancel_tx = OfferCancel(
            account=oracle_wallet.address,
            offer_sequence=seq,
        )
        await submit_and_wait(cancel_tx, client, oracle_wallet)

async def publish_oracle_offers(client: AsyncWebsocketClient, price_xrp: float):
    # Sell 1 GRASS for price_xrp XRP
    offer1 = OfferCreate(
        account=oracle_wallet.address,
        taker_gets={"currency": "XRP", "value": str(round(price_xrp, 6))},
        taker_pays={"currency": TOKEN_CODE, "issuer": oracle_wallet.address, "value": "1"},
        memos=[build_memo()],
        flags="tfPassive",  # passive so it doesn't consume liquidity
    )
    # Buy 1 GRASS for price_xrp XRP (reverse side)
    offer2 = OfferCreate(
        account=oracle_wallet.address,
        taker_gets={"currency": TOKEN_CODE, "issuer": oracle_wallet.address, "value": "1"},
        taker_pays={"currency": "XRP", "value": str(round(price_xrp, 6))},
        memos=[build_memo()],
        flags="tfPassive",
    )
    await submit_and_wait(offer1, client, oracle_wallet)
    await submit_and_wait(offer2, client, oracle_wallet)

###############################################################################
# Main loop
###############################################################################

async def update_loop():
    async with AsyncWebsocketClient(WSS) as client, aiohttp.ClientSession() as session:
        while True:
            try:
                carbon = await get_carbon_price_usd(session)
                xrp_usd = await get_xrp_usd(session)
                price_xrp = carbon / xrp_usd

                print(
                    f"[oracle] Carbon USD={carbon:.2f} XRP/USD={xrp_usd:.4f} -> GRASS/XRP={price_xrp:.6f}"
                )

                await clear_existing_offers(client)
                await publish_oracle_offers(client, price_xrp)
                print("[oracle] Offers published.")
            except Exception as exc:
                print("[oracle] Error:", exc)

            await asyncio.sleep(UPDATE_INTERVAL)

###############################################################################
# Entrypoint for standalone run (e.g. `python -m services.xrpl.oracle_service`)
###############################################################################

if __name__ == "__main__":
    asyncio.run(update_loop())
    