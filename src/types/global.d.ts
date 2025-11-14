// EIP-1193 Provider interface
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  providers?: EthereumProvider[];
}

// EIP-6963 Wallet provider info
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EthereumProvider;
}

interface Window {
  ethereum?: EthereumProvider;
  // EIP-6963 support
  eip6963?: {
    requestProvider: () => Promise<EIP6963ProviderDetail | null>;
  };
}

// Wallet provider with metadata
interface DetectedWallet {
  id: string;
  name: string;
  icon?: string;
  provider: EthereumProvider;
  rdns?: string;
} 