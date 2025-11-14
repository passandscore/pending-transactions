import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, AlertCircle, Skull, ExternalLink } from 'lucide-react';

interface WalletConnectorProps {
  onConnect: (address: string, provider: any) => void;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onConnect }) => {
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showWallets, setShowWallets] = useState(false);

  // Detect available wallets
  useEffect(() => {
    const allWallets: DetectedWallet[] = [];
    const providerMap = new Map<EthereumProvider, DetectedWallet>();

    // Helper to normalize wallet ID - ensures consistent IDs across detection methods
    const normalizeWalletId = (id: string, name: string): string => {
      const idLower = id.toLowerCase();
      const nameLower = name.toLowerCase();
      
      // Normalize known wallet IDs from rdns/uuid to standard names
      if (idLower.includes('metamask') || nameLower.includes('metamask')) return 'metamask';
      if (idLower.includes('coinbase') || nameLower.includes('coinbase')) return 'coinbase';
      if (idLower.includes('brave') || nameLower.includes('brave')) return 'brave';
      if (idLower.includes('trust') || nameLower.includes('trust')) return 'trust';
      
      // If no match, use the ID as-is or generate from name
      if (id && id !== idLower.replace(/[^a-z0-9]/g, '-')) {
        return idLower.replace(/[^a-z0-9-]/g, '-');
      }
      return nameLower.replace(/\s+/g, '-');
    };

    // Helper to add wallet - deduplicates by provider instance and wallet name/ID only
    const addWallet = (wallet: DetectedWallet) => {
      // Check if this exact provider instance is already mapped
      if (providerMap.has(wallet.provider)) {
        // If this wallet has better metadata (icon, etc.), replace the existing one
        const existing = providerMap.get(wallet.provider)!;
        if (wallet.icon && !existing.icon) {
          const index = allWallets.indexOf(existing);
          if (index !== -1) {
            allWallets[index] = wallet;
            providerMap.set(wallet.provider, wallet);
            setDetectedWallets([...allWallets]);
            setShowWallets(true);
          }
        }
        return;
      }

      // Check if we already have a wallet with the same ID (name-based deduplication only)
      const existingWallet = allWallets.find(w => w.id === wallet.id);

      if (existingWallet) {
        // Prefer the one with icon if we have it
        if (wallet.icon && !existingWallet.icon) {
          const index = allWallets.indexOf(existingWallet);
          providerMap.delete(existingWallet.provider);
          allWallets[index] = wallet;
          providerMap.set(wallet.provider, wallet);
          setDetectedWallets([...allWallets]);
          setShowWallets(true);
        }
        return;
      }

      // Add new wallet
      allWallets.push(wallet);
      providerMap.set(wallet.provider, wallet);
      setDetectedWallets([...allWallets]);
      setShowWallets(true);
    };

    // 1. EIP-6963 wallet detection (modern standard) - prioritize these for better metadata
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const announceProviders = (event: CustomEvent) => {
        const detail = event.detail;
        if (detail && detail.info && detail.provider) {
          // Normalize ID to ensure consistent matching with legacy detection
          const rawId = detail.info.rdns || detail.info.uuid || detail.info.name;
          const walletId = normalizeWalletId(rawId, detail.info.name);
          
          addWallet({
            id: walletId,
            name: detail.info.name,
            icon: detail.info.icon,
            provider: detail.provider,
            rdns: detail.info.rdns,
          });
        }
      };

      window.addEventListener('eip6963:announceProvider', announceProviders as EventListener);

      // Request providers to announce themselves
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      // Clean up listener after timeout
      setTimeout(() => {
        window.removeEventListener('eip6963:announceProvider', announceProviders as EventListener);
      }, 1000);
    }

    // 2. Check for multiple providers (Coinbase Wallet, etc.)
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      window.ethereum.providers.forEach((provider) => {
        // Skip if this provider instance is already mapped
        if (providerMap.has(provider)) {
          return;
        }

        let walletName = 'Ethereum Wallet';
        let walletId = 'ethereum';

        if (provider.isMetaMask) {
          walletName = 'MetaMask';
          walletId = 'metamask';
        } else if (provider.isCoinbaseWallet) {
          walletName = 'Coinbase Wallet';
          walletId = 'coinbase';
        } else if (provider.isBraveWallet) {
          walletName = 'Brave Wallet';
          walletId = 'brave';
        }

        addWallet({
          id: walletId,
          name: walletName,
          provider: provider,
        });
      });
    } else if (window.ethereum) {
      // 3. Legacy single provider detection
      // Skip if this provider instance is already mapped
      if (!providerMap.has(window.ethereum)) {
        let walletName = 'Ethereum Wallet';
        let walletId = 'ethereum';

        if (window.ethereum.isMetaMask) {
          walletName = 'MetaMask';
          walletId = 'metamask';
        } else if ((window.ethereum as any).isCoinbaseWallet) {
          walletName = 'Coinbase Wallet';
          walletId = 'coinbase';
        } else if ((window.ethereum as any).isBraveWallet) {
          walletName = 'Brave Wallet';
          walletId = 'brave';
        } else if ((window.ethereum as any).isTrust) {
          walletName = 'Trust Wallet';
          walletId = 'trust';
        }

        addWallet({
          id: walletId,
          name: walletName,
          provider: window.ethereum,
        });
      }
    }
  }, []);

  const connectWallet = async (wallet: DetectedWallet) => {
    setConnectingWalletId(wallet.id);
    setError('');

    try {
      // Request account access
      const accounts = await wallet.provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        // Store the selected provider globally for use in other components
        (window as any).selectedWalletProvider = wallet.provider;
        onConnect(accounts[0], wallet.provider);
      } else {
        throw new Error('No accounts found. Please connect your wallet.');
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection request.');
      } else {
      setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setConnectingWalletId(null);
    }
  };

  const getWalletIcon = (wallet: DetectedWallet) => {
    if (wallet.icon) {
      return <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" />;
    }
    return <Wallet className="w-6 h-6" />;
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-black/90 backdrop-blur-sm border border-gray-900/50 rounded-xl p-6 shadow-2xl shadow-black/50 max-w-lg w-full mx-4"
      >
        <div className="text-center">
          <motion.div
            className="w-16 h-16 bg-red-900/30 border border-red-800/50 rounded-full flex items-center justify-center mx-auto mb-6"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Skull className="w-8 h-8 text-red-500" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-200 mb-4 tracking-wide">PENDING TRANSACTION RESOLVER</h2>
          <p className="text-gray-400 mb-8 tracking-wide">
            {showWallets
              ? 'Select your wallet to begin transaction resolution protocol'
              : 'Connect your wallet to begin transaction resolution protocol'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 bg-red-900/20 border border-red-800/30 rounded-lg p-3 mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}

          {showWallets && detectedWallets.length > 0 ? (
            <div className="space-y-3 mb-6">
              {detectedWallets.map((wallet) => {
                const isConnecting = connectingWalletId === wallet.id;
                return (
                  <motion.button
                    key={wallet.id}
                    onClick={() => connectWallet(wallet)}
                    disabled={connectingWalletId !== null}
                    className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 hover:text-white w-full py-4 rounded-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium tracking-wide"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
                        <span>CONNECTING...</span>
                      </>
                    ) : (
                      <>
                        {getWalletIcon(wallet)}
                        <span>{wallet.name.toUpperCase()}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ) : detectedWallets.length === 0 && !connectingWalletId ? (
            <div className="mb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4 mb-6"
              >
                <p className="text-amber-400 text-sm mb-4">
                  No Ethereum wallets detected. Please install a wallet extension to continue.
                </p>
                <div className="space-y-2 text-left">
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Install MetaMask</span>
                  </a>
                  <a
                    href="https://www.coinbase.com/wallet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Install Coinbase Wallet</span>
                  </a>
                  <a
                    href="https://brave.com/wallet/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Install Brave Wallet</span>
                  </a>
                </div>
              </motion.div>
            </div>
          ) : null}

          <div className="mt-6 text-xs text-gray-600">
            <p>Ethereum wallet browser extension required for transaction resolution</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletConnector; 
