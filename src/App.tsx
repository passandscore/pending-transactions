import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Settings, Zap, Info, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
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
        className="absolute top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"
        animate={{ float: true }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"
        animate={{ float: true }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 w-16 h-16 bg-pink-500/20 rounded-full blur-xl"
        animate={{ float: true }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-4 text-shadow glow-text"
            animate={{ glow: true }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Pending Transaction Remover
          </motion.h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Safely remove stuck transactions by sending a higher gas transaction to yourself
          </p>
        </motion.div>

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
              <div className="glass-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Wallet Connected</h2>
                      <p className="text-white/60 text-sm">{walletAddress}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsConnected(false)}
                    className="glass-button text-sm"
                  >
                    Disconnect
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
          className="fixed bottom-6 right-6 p-4 glass rounded-full hover:bg-white/20 transition-all duration-300"
        >
          <Info className="w-6 h-6 text-white" />
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