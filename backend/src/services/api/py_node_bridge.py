"""
Bridge between Python FastAPI and Node.js XRPL client
"""

import asyncio
import json
import subprocess
import os
from pathlib import Path
from typing import Dict, Any, Optional

async def execute_js_bridge(method: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call Node.js code from Python using a bridge script
    
    Args:
        method: The method to call
        params: Parameters to pass to the method
        
    Returns:
        Result of the Node.js function call
    """
    try:
        # Create a temporary bridge file
        bridge_dir = Path(__file__).parent.parent.parent / "temp"
        bridge_dir.mkdir(exist_ok=True)
        
        bridge_file = bridge_dir / "xrpl_bridge.js"
        
        # Write the bridge code
        bridge_code = f"""
const TokenizationService = require('../services/xrpl/tokenizationService');
const xrpl = require('xrpl');

async function runBridge() {{
    try {{
        const service = new TokenizationService();
        const params = {json.dumps(params)};
        
        // Handle method-specific logic
        let result;
        
        if ('{method}' === 'createGreenAssetToken') {{
            // Create wallet from seed
            const issuerWallet = xrpl.Wallet.fromSeed(params.walletSeed);
            
            // Call the method
            result = await service.createGreenAssetToken(params.tokenData, issuerWallet);
        }} else if ('{method}' === 'authorizeHolder') {{
            const issuerWallet = xrpl.Wallet.fromSeed(params.issuerSeed);
            result = await service.authorizeHolder(issuerWallet, params.holderAddress, params.issuanceID);
        }} else if ('{method}' === 'mintToHolder') {{
            const issuerWallet = xrpl.Wallet.fromSeed(params.issuerSeed);
            result = await service.mintToHolder(issuerWallet, params.holderAddress, params.issuanceID, params.amount);
        }} else if ('{method}' === 'getHoldings') {{
            result = await service.getHoldings(params.account, params.issuanceID);
        }} else {{
            throw new Error(`Unsupported method: {method}`);
        }}
        
        // Disconnect and return result
        await service.disconnect();
        console.log(JSON.stringify(result));
    }} catch (error) {{
        console.error(JSON.stringify({{ success: false, error: error.message }}));
        process.exit(1);
    }}
}}

runBridge();
"""
        
        # Write the bridge file
        with open(bridge_file, 'w') as f:
            f.write(bridge_code)
        
        # Execute the bridge
        process = await asyncio.create_subprocess_exec(
            'node', str(bridge_file),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        # Parse the result
        if process.returncode != 0:
            try:
                error_data = json.loads(stderr.decode())
                return error_data
            except:
                return {"success": False, "error": stderr.decode()}
        
        return json.loads(stdout.decode())
    
    except Exception as e:
        return {"success": False, "error": str(e)}