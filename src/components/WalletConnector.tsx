import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, AlertCircle } from 'lucide-react';

interface WalletConnectorProps {
  onConnect: (address: string) => void;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
      } else {
        throw new Error('No accounts found. Please connect your wallet.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card max-w-md mx-auto"
    >
      <div className="text-center">
        <motion.div
          className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Wallet className="w-8 h-8 text-blue-400" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
        <p className="text-white/70 mb-8">
          Connect your MetaMask wallet to start removing pending transactions
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </motion.div>
        )}

        <motion.button
          onClick={connectWallet}
          disabled={isConnecting}
          className="glass-button w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>Connect MetaMask</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <div className="mt-6 text-xs text-white/50">
          <p>This app requires MetaMask to be installed in your browser</p>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletConnector; 