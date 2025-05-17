import { Client, Wallet as XrplWallet } from 'xrpl'

// XRPL network configurations
const networks = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://testnet.xrpl.org',                 // Primary testnet endpoint
  testnetAlt: 'wss://s.altnet.rippletest.net:51233', // Alternative testnet endpoint
  devnet: 'wss://s.devnet.rippletest.net:51233'
}

// Default to testnet for development
const defaultNetwork = 'testnet'

class XrplService {
  private static instance: XrplService
  private client: Client
  private network: string
  private isConnecting: boolean = false

  private constructor(network: keyof typeof networks = defaultNetwork) {
    this.network = networks[network]
    this.client = new Client(this.network)
  }

  // Singleton pattern
  public static getInstance(network?: keyof typeof networks): XrplService {
    if (!XrplService.instance) {
      XrplService.instance = new XrplService(network)
    }
    return XrplService.instance
  }

  // Connect to the XRPL network
  public async connect(): Promise<void> {
    if (this.client.isConnected()) return
    
    if (this.isConnecting) {
      // Wait for existing connection attempt to complete
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (this.client.isConnected()) return
    }

    try {
      this.isConnecting = true
      
      // Try primary endpoint
      try {
        await this.client.connect()
        console.log(`Connected to XRPL ${this.network}`)
        return
      } catch (primaryError) {
        console.warn(`Failed to connect to primary endpoint ${this.network}:`, primaryError)
        
        // Try alternative endpoint if primary fails
        if (this.network === networks.testnet) {
          console.log('Trying alternative testnet endpoint...')
          this.client.disconnect()
          this.client = new Client(networks.testnetAlt)
          
          try {
            await this.client.connect()
            console.log(`Connected to alternative XRPL endpoint ${networks.testnetAlt}`)
            this.network = networks.testnetAlt
            return
          } catch (altError) {
            console.error('Failed to connect to alternative endpoint:', altError)
            throw new Error('Failed to connect to any XRPL endpoint')
          }
        } else {
          throw primaryError
        }
      }
    } catch (error) {
      console.error('Failed to connect to XRPL:', error)
      throw error
    } finally {
      this.isConnecting = false
    }
  }

  // Disconnect from the XRPL network
  public async disconnect(): Promise<void> {
    if (!this.client.isConnected()) return
    
    try {
      await this.client.disconnect()
      console.log('Disconnected from XRPL')
    } catch (error) {
      console.error('Failed to disconnect from XRPL:', error)
      throw error
    }
  }

  // Get account information
  public async getAccountInfo(address: string): Promise<any> {
    await this.connect()

    try {
      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      })
      
      return response.result.account_data
    } catch (error: any) {
      // Handle case where account doesn't exist yet
      if (error.data?.error === 'actNotFound') {
        return null
      }
      
      console.error('Failed to get account info:', error)
      throw error
    }
  }

  // Get account balance in XRP
  public async getAccountBalance(address: string): Promise<number> {
    if (!address || !XrplService.isValidXrplAddress(address)) {
      console.warn('Invalid XRPL address format:', address)
      return 0
    }
    
    try {
      const accountInfo = await this.getAccountInfo(address)
      
      if (!accountInfo) {
        // For demo/UI purposes, return a small non-zero amount for test wallets
        // to improve the user experience
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Using mock balance for account', address.substring(0, 8) + '...')
          return 1000 + (parseInt(address.substring(1, 5), 36) % 9000) / 100
        }
        return 0
      }
      
      // Convert drops to XRP (1 XRP = 1,000,000 drops)
      return Number(accountInfo.Balance) / 1000000
    } catch (error) {
      console.error('Failed to get account balance:', error)
      
      // For dev/demo purposes, generate a mock balance
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using mock balance due to error')
        const mockBalance = 1000 + Math.floor(Math.random() * 9000)
        return mockBalance
      }
      
      return 0
    }
  }

  // Create a test wallet (for development only)
  public async createTestWallet(): Promise<XrplWallet> {
    await this.connect()
    
    try {
      const { wallet } = await this.client.fundWallet()
      return wallet
    } catch (error) {
      console.error('Failed to create test wallet:', error)
      throw error
    }
  }

  // Get client instance
  public getClient(): Client {
    return this.client
  }

  // Check if an address is a valid XRPL address
  public static isValidXrplAddress(address: string): boolean {
    // Simple validation: r followed by 24-34 alphanumeric characters
    return /^r[a-zA-Z0-9]{24,34}$/.test(address)
  }
}

export default XrplService