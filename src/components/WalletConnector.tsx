import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, AlertCircle, Skull } from 'lucide-react';

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
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-black/90 backdrop-blur-sm border border-gray-900/50 rounded-xl p-6 shadow-2xl shadow-black/50 max-w-md w-full mx-4"
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
            Connect your MetaMask wallet to begin transaction resolution protocol
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

          <motion.button
            onClick={connectWallet}
            disabled={isConnecting}
            className="bg-gradient-to-r from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 border border-red-700/50 text-gray-200 hover:text-white w-full py-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium tracking-wide shadow-lg shadow-red-900/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
                <span>ESTABLISHING CONNECTION...</span>
              </>
            ) : (
              <>
                <span>CONNECT METAMASK</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <div className="mt-6 text-xs text-gray-600">
            <p>MetaMask browser extension required for transaction resolution</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletConnector; 