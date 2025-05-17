import { Client, Wallet as XrplWallet } from 'xrpl'

// XRPL network configurations
const networks = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
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
      return
    }

    try {
      this.isConnecting = true
      await this.client.connect()
      console.log(`Connected to XRPL ${this.network}`)
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
    try {
      const accountInfo = await this.getAccountInfo(address)
      
      if (!accountInfo) {
        return 0
      }
      
      // Convert drops to XRP (1 XRP = 1,000,000 drops)
      return Number(accountInfo.Balance) / 1000000
    } catch (error) {
      console.error('Failed to get account balance:', error)
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