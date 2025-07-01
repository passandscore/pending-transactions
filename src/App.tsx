import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Settings, Zap, Info, ArrowRight, CheckCircle, AlertCircle, Skull, Eye } from 'lucide-react';
import WalletConnector from './components/WalletConnector';
import TransactionForm from './components/TransactionForm';
import InfoPanel from './components/InfoPanel';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 liquid-bg"></div>
      
      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 bg-red-500/10 rounded-full blur-xl"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-24 h-24 bg-red-800/10 rounded-full blur-xl"
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 w-16 h-16 bg-red-600/10 rounded-full blur-xl"
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          {!isConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <WalletConnector 
                onConnect={(address) => {
                  setIsConnected(true);
                  setWalletAddress(address);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-black/90 backdrop-blur-sm border border-gray-900/50 rounded-xl p-6 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-900/30 border border-green-800/50 rounded-lg">
                      <Eye className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-200 tracking-wide">CONNECTED</h2>
                      <p className="text-gray-500 text-sm font-mono">{walletAddress}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsConnected(false)}
                    className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-gray-200 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:border-gray-600"
                  >
                    TERMINATE
                  </button>
                </div>
              </div>

              <TransactionForm walletAddress={walletAddress} />
            </motion.div>
          )}
        </div>

        {/* Info button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => setShowInfo(!showInfo)}
          className="fixed bottom-6 right-6 p-4 bg-black/80 backdrop-blur-sm border border-gray-800/50 rounded-full hover:bg-gray-800/80 transition-all duration-300 shadow-lg shadow-black/50"
        >
          <Info className="w-6 h-6 text-gray-300" />
        </motion.button>

        {/* Info panel */}
        {showInfo && (
          <InfoPanel onClose={() => setShowInfo(false)} />
        )}
      </div>
    </div>
  );
}

export default App; 