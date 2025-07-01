import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Zap, Shield, Skull, Eye } from 'lucide-react';

interface InfoPanelProps {
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 backdrop-blur-sm border border-gray-900/50 rounded-xl p-6 shadow-2xl shadow-black/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-900/30 border border-red-800/50 rounded-lg">
              <Skull className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-200 tracking-wide">PENDING TRANSACTION RESOLVER</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-gray-200 p-2 rounded-lg transition-all duration-200 hover:border-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3 flex items-center space-x-2 tracking-wide">
              <Zap className="w-5 h-5 text-red-500" />
              <span>What does this tool do?</span>
            </h3>
            <p className="text-gray-400 leading-relaxed">
              This tool sends zero value transactions to yourself to resolve pending transactions visible on the blockchain or cancel transactions stuck in the mempool. 
              It does NOT add additional value to contract calls to speed them up.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3 flex items-center space-x-2 tracking-wide">
              <Shield className="w-5 h-5 text-red-500" />
              <span>How does it work?</span>
            </h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-900/30 border border-red-800/50 rounded-full flex items-center justify-center text-sm font-bold text-red-400 mt-0.5">
                  1
                </div>
                <p>Connect your MetaMask wallet</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-900/30 border border-red-800/50 rounded-full flex items-center justify-center text-sm font-bold text-red-400 mt-0.5">
                  2
                </div>
                <p>Set the nonce of your pending/stuck transaction</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-900/30 border border-red-800/50 rounded-full flex items-center justify-center text-sm font-bold text-red-400 mt-0.5">
                  3
                </div>
                <p>Send a zero value transaction to yourself with the same nonce</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-900/30 border border-red-800/50 rounded-full flex items-center justify-center text-sm font-bold text-red-400 mt-0.5">
                  4
                </div>
                <p>The pending or stuck transaction is resolved/canceled</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3 flex items-center space-x-2 tracking-wide">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Why does this work?</span>
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Ethereum uses a nonce system where each account has a sequential transaction counter. 
              When you send a new transaction with the same nonce as a pending or stuck transaction, it replaces the original one. 
              Since this tool sends zero value transactions to yourself, no ETH is transferred - only gas fees are paid.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3 flex items-center space-x-2 tracking-wide">
              <Eye className="w-5 h-5 text-red-500" />
              <span>Important Notes</span>
            </h3>
            <ul className="text-gray-400 space-y-2">
              <li>• This tool ONLY sends zero value transactions to yourself</li>
              <li>• It resolves pending transactions visible on the blockchain</li>
              <li>• It cancels transactions stuck in the mempool</li>
              <li>• It does NOT add additional value to contract calls to speed them up</li>
              <li>• It does NOT handle transactions stuck due to insufficient gas</li>
              <li>• Always verify the nonce matches your pending/stuck transaction</li>
              <li>• You will only pay gas fees, no ETH is transferred</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3 tracking-wide">RPC Endpoints</h3>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-900/60 border border-gray-800/50 p-3 rounded-lg">
                <p className="text-red-400 font-medium">Alchemy (Recommended)</p>
                <p className="text-gray-500">https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY</p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800/50 p-3 rounded-lg">
                <p className="text-red-400 font-medium">Infura</p>
                <p className="text-gray-500">https://mainnet.infura.io/v3/YOUR_PROJECT_ID</p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800/50 p-3 rounded-lg">
                <p className="text-red-400 font-medium">Public RPC (Less Reliable)</p>
                <p className="text-gray-500">https://eth.llamarpc.com</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InfoPanel; 