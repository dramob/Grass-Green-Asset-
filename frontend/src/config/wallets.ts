/**
 * Configuration for wallet providers
 */
export const walletConfig = {
  // Xaman (XUMM) API key - sign up at https://apps.xumm.dev/
  xaman: {
    apiKey: import.meta.env.VITE_XAMAN_API_KEY || 'ff28c30c-cec7-4fed-bb5f-03a8965e0297',
    redirectUrl: window.location.origin || 'http://localhost:5173'
  }
}

export default walletConfig