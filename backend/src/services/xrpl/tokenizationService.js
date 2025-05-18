const xrpl = require("xrpl")

/**
 * Utility to manage connection lifecycle with automatic reconnection.
 */
class XRPLClient {
  /**
   * @param {string} [endpoint] WebSocket endpoint of the XRPL node.
   */
  constructor(endpoint) {
    this.endpoint = endpoint || process.env.XRPL_RPC_ENDPOINT || "wss://s.altnet.rippletest.net:51233"
    this.client = new xrpl.Client(this.endpoint)
    this._connected = false
  }

  async connect() {
    if (!this._connected) {
      await this.client.connect()
      this._connected = true
    }
  }

  async disconnect() {
    if (this._connected) {
      await this.client.disconnect()
      this._connected = false
    }
  }
}

/**
 * TokenizationService encapsulates common workflows for Multi‑Purpose Tokens.
 */
class TokenizationService extends XRPLClient {
  /**
   * Create a new MPTokenIssuance on the ledger.
   * @param {xrpl.Wallet} issuerWallet  Wallet of the issuer (must hold XRP reserve).
   * @param {object} opts  Issuance parameters.
   * @param {number} [opts.assetScale=0]  Decimal places (0‑9) allowed by this token.
   * @param {string|number} [opts.maximumAmount]  Cap on supply (omit for uncapped).
   * @param {number} [opts.transferFee=0]  Hundredths of a percent fee charged on secondary transfers.
   * @param {string} [opts.metadata]  Arbitrary UTF‑8 metadata (will be hex‑encoded).
   * @param {number} [opts.flags=0]  Bit‑wise OR of tfMPT* flags.
   * @returns {Promise<string>} The new 192‑bit MPTokenIssuanceID (hex).
   */
  async createIssuance(issuerWallet, {
    assetScale = 0,
    maximumAmount,
    transferFee = 0,
    metadata,
    flags = 0
  } = {}) {
    await this.connect()

    const tx = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: issuerWallet.classicAddress,
      AssetScale: assetScale,
      MaximumAmount: maximumAmount !== undefined ? maximumAmount.toString() : undefined,
      TransferFee: transferFee,
      MPTokenMetadata: metadata ? Buffer.from(metadata, "utf8").toString("hex") : undefined,
      Flags: flags
    }

    const prepared = await this.client.autofill(tx)
    const signed = issuerWallet.sign(prepared)
    const submission = await this.client.submitAndWait(signed.tx_blob)

    // The server synthesises `mpt_issuance_id` for convenience (see XRPL docs)
    const issuanceID = submission?.result?.meta?.mpt_issuance_id

    if (!issuanceID) {
      throw new Error("Unable to locate mpt_issuance_id in transaction result")
    }

    return issuanceID
  }

  /**
   * Authorize a holder for an MPT (only required if tfMPTRequireAuth is set).
   * @param {xrpl.Wallet} issuerWallet  Wallet of the issuer.
   * @param {string} holderAddress  Classic address of the prospective holder.
   * @param {string} issuanceID  192‑bit issuance ID.
   */
  async authorizeHolder(issuerWallet, holderAddress, issuanceID) {
    await this.connect()

    const tx = {
      TransactionType: "MPTokenAuthorize",
      Account: issuerWallet.classicAddress,
      Holder: holderAddress,
      MPTokenIssuanceID: issuanceID
    }

    const prepared = await this.client.autofill(tx)
    const signed = issuerWallet.sign(prepared)
    return this.client.submitAndWait(signed.tx_blob)
  }

  /**
   * Self‑authorization by a holder (when tfMPTRequireAuth *not* set on issuance).
   * @param {xrpl.Wallet} holderWallet Wallet of the holder.
   * @param {string} issuanceID 192‑bit issuance ID.
   */
  async holderSelfAuthorize(holderWallet, issuanceID) {
    await this.connect()

    const tx = {
      TransactionType: "MPTokenAuthorize",
      Account: holderWallet.classicAddress,
      MPTokenIssuanceID: issuanceID
    }

    const prepared = await this.client.autofill(tx)
    const signed = holderWallet.sign(prepared)
    return this.client.submitAndWait(signed.tx_blob)
  }

  /**
   * Mint (distribute) MPTs to a holder via a direct Payment.
   * @param {xrpl.Wallet} issuerWallet  Issuer wallet.
   * @param {string} holderAddress  Destination classic address.
   * @param {string} issuanceID 192‑bit issuance ID.
   * @param {string|number} amount  Whole‑number value *before* applying AssetScale.
   */
  async mintToHolder(issuerWallet, holderAddress, issuanceID, amount) {
    await this.connect()

    const mptAmount = {
      mpt_issuance_id: issuanceID,
      value: amount.toString()
    }

    const tx = {
      TransactionType: "Payment",
      Account: issuerWallet.classicAddress,
      Destination: holderAddress,
      Amount: mptAmount,
      DeliverMax: mptAmount,
      SendMax: mptAmount
    }

    const prepared = await this.client.autofill(tx)
    const signed = issuerWallet.sign(prepared)
    return this.client.submitAndWait(signed.tx_blob)
  }

  /**
   * Retrieve MPToken balance info for an account.
   * @param {string} account Classic address.
   * @param {string} [issuanceID] Optional issuance to filter.
   */
  async getHoldings(account, issuanceID) {
    await this.connect()

    const request = {
      command: "ledger_entry",
      mptoken: issuanceID
        ? { account, mpt_issuance_id: issuanceID }
        : account // Fallback to ID string if already computed
    }

    return this.client.request(request)
  }

  /**
   * Create a green asset token using MPT
   * @param {Object} tokenData - Token data (name, description, sdgs, etc.)
   * @param {xrpl.Wallet} issuerWallet - Token issuer's wallet
   * @returns {Promise<Object>} Token creation result
   */
  async createGreenAssetToken(tokenData, issuerWallet) {
    try {
      // Create MPT issuance with the project metadata
      const metadata = JSON.stringify({
        name: tokenData.name,
        description: tokenData.description, 
        company: tokenData.company,
        projectId: tokenData.projectId || '',
        sdgs: tokenData.sdgs,
        verificationScore: tokenData.verificationScore,
        tokenPrice: tokenData.tokenPrice || 1
      });

      const maximumAmount = tokenData.maximumAmount || "100000000";

      const issuanceID = await this.createIssuance(issuerWallet, {
        maximumAmount: maximumAmount,
        metadata: metadata,
        assetScale: tokenData.assetScale || 0,
        transferFee: tokenData.transferFee || 0
      });

      return {
        success: true,
        issuanceID: issuanceID,
        issuerWallet: issuerWallet.classicAddress,
        totalSupply: parseFloat(maximumAmount),
        availableSupply: parseFloat(maximumAmount),
        projectId: tokenData.projectId || '',
        tokenPrice: tokenData.tokenPrice || 1
      };
    } catch (error) {
      console.error('Failed to create green asset token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Python-friendly wrapper for createGreenAssetToken
   * @param {Object} tokenData - Token data (name, description, sdgs, etc.)
   * @param {xrpl.Wallet} issuerWallet - Token issuer's wallet 
   * @returns {Promise<Object>} Token creation result
   */
  createGreenAssetToken = async (tokenData, issuerWallet) => {
    return await this.createGreenAssetToken(tokenData, issuerWallet);
  }
  
  /**
   * Get the current price of tokens from the oracle
   * @param {string} issuanceID - The token issuance ID
   * @returns {Promise<Object>} Price information
   */
  async getTokenPrice(issuanceID) {
    try {
      await this.connect();
      
      // For a real implementation, we would fetch the offers from the DEX 
      // or use the Oracle service to get the current price
      // This is a placeholder implementation
      
      // Simulate oracle price fetch
      return {
        success: true,
        tokenCode: "GRASS",
        priceXrp: 5.25,  // Example price: 5.25 XRP per GRASS token
        priceUsd: 2.65   // Example USD price (if XRP is at $0.50)
      };
    } catch (error) {
      console.error('Failed to get token price:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Purchase tokens from a project
   * @param {string} buyerWallet - The buyer's wallet
   * @param {string} issuanceID - The token issuance ID 
   * @param {string} issuerWallet - The issuer wallet
   * @param {number} amount - The amount to purchase
   * @returns {Promise<Object>} Purchase result
   */
  async purchaseTokens(buyerWallet, issuanceID, issuerWallet, amount) {
    try {
      await this.connect();
      
      // First authorize the buyer to hold the tokens if needed
      // then mint directly to the buyer
      await this.authorizeHolder(issuerWallet, buyerWallet.classicAddress, issuanceID);
      
      // Send the tokens
      const result = await this.mintToHolder(
        issuerWallet,
        buyerWallet.classicAddress,
        issuanceID,
        amount
      );
      
      return {
        success: true,
        txResult: result,
        amount: amount,
        issuanceID: issuanceID,
        buyerAddress: buyerWallet.classicAddress
      };
    } catch (error) {
      console.error('Failed to purchase tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TokenizationService