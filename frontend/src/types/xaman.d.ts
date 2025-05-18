// Type definitions for Xaman (XUMM) SDK
declare global {
  interface Window {
    Xumm: XummConstructor;
    xumm?: XummSDK;
  }
}

interface XummConstructor {
  new (apiKey: string, options?: { redirectUrl?: string }): XummSDK;
}

interface XummSDK {
  on(event: 'ready' | 'success' | 'logout', callback: () => void): void;
  authorize(): Promise<void>;
  logout(): Promise<void>;
  user: {
    account: Promise<string>;
  };
  environment: {
    jwt?: string;
  };
}

export {};