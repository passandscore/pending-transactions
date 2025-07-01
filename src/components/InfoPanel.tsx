import React from 'react';
import { motion } from 'framer-motion';
import { X, Info, AlertTriangle, Zap, Shield } from 'lucide-react';

interface InfoPanelProps {
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">How It Works</h2>
          </div>
          <button
            onClick={onClose}
            className="glass-button p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>What is this tool?</span>
            </h3>
            <p className="text-white/80 leading-relaxed">
              This is a specialized tool designed to help you remove stuck or pending transactions from the Ethereum blockchain. 
              When a transaction gets stuck due to low gas prices or network congestion, this tool allows you to send a new 
              transaction with the same nonce but higher gas price, effectively replacing the pending transaction.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>How does it work?</span>
            </h3>
            <div className="space-y-3 text-white/80">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-300 mt-0.5">
                  1
                </div>
                <p>Connect your MetaMask wallet to access your account</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-300 mt-0.5">
                  2
                </div>
                <p>Configure your RPC URL (use a reliable provider like Alchemy or Infura)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-300 mt-0.5">
                  3
                </div>
                <p>Set the nonce to match your pending transaction (use the "Get" button to fetch current nonce)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-300 mt-0.5">
                  4
                </div>
                <p>Set a higher gas price than your pending transaction to ensure it gets processed first</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-300 mt-0.5">
                  5
                </div>
                <p>Send a small amount of ETH to yourself - this transaction will replace the pending one</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span>Why does this work?</span>
            </h3>
            <p className="text-white/80 leading-relaxed mb-3">
              Ethereum uses a nonce system to ensure transaction ordering. Each account has a nonce that must increase 
              sequentially. When you send a new transaction with the same nonce as a pending transaction but with a 
              higher gas price, miners will prioritize the higher-paying transaction, effectively canceling the pending one.
            </p>
            <p className="text-white/80 leading-relaxed">
              This is a standard and safe method used throughout the Ethereum ecosystem to handle stuck transactions.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Safety & Best Practices</span>
            </h3>
            <ul className="text-white/80 space-y-2">
              <li>• Always verify the nonce matches your pending transaction</li>
              <li>• Use a gas price at least 20% higher than your pending transaction</li>
              <li>• Start with a small amount (0.001 ETH) to test the process</li>
              <li>• Use a reliable RPC provider to avoid connection issues</li>
              <li>• Double-check all transaction details before sending</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Common RPC URLs</h3>
            <div className="space-y-2 text-sm">
              <div className="glass p-3">
                <p className="text-blue-300 font-medium">Alchemy (Recommended)</p>
                <p className="text-white/60">https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY</p>
              </div>
              <div className="glass p-3">
                <p className="text-blue-300 font-medium">Infura</p>
                <p className="text-white/60">https://mainnet.infura.io/v3/YOUR_PROJECT_ID</p>
              </div>
              <div className="glass p-3">
                <p className="text-blue-300 font-medium">Public RPC (Less Reliable)</p>
                <p className="text-white/60">https://eth.llamarpc.com</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InfoPanel; 