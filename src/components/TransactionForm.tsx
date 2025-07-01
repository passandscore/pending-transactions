import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Zap, Send, AlertCircle, CheckCircle, ExternalLink, Clock, Info } from 'lucide-react';
import { ethers } from 'ethers';

interface TransactionFormProps {
  walletAddress: string;
}

interface PendingTransaction {
  hash: string;
  gasPrice: string;
  gasLimit: string;
  value: string;
  to: string;
  from: string;
  nonce: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ walletAddress }) => {
  const [formData, setFormData] = useState({
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    nonce: '',
    gasPrice: '50',
    gasLimit: '21000',
    value: '0'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gasDetails, setGasDetails] = useState({
    currentGasPrice: '',
    estimatedGas: '',
    totalCost: ''
  });
  const [isFetchingNonce, setIsFetchingNonce] = useState(false);
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [isFetchingPendingTx, setIsFetchingPendingTx] = useState(false);
  const [hasManualNonce, setHasManualNonce] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track if user manually entered a nonce
    if (name === 'nonce' && value.trim() !== '') {
      setHasManualNonce(true);
    }
  };

  // Fetch pending transaction details
  const fetchPendingTransaction = async (nonce: number) => {
    if (!formData.rpcUrl || formData.rpcUrl === 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY') {
      return;
    }

    setIsFetchingPendingTx(true);
    try {
      const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
      
      // Try to get pending transactions from mempool
      try {
        const pendingTxs = await provider.send('txpool_content', []);
        const pending = pendingTxs.pending || {};
        
        // Find transaction with matching nonce and from address
        let foundTx: any = null;
        for (const [address, txs] of Object.entries(pending)) {
          if (address.toLowerCase() === walletAddress.toLowerCase()) {
            for (const [txNonce, tx] of Object.entries(txs as any)) {
              if (parseInt(txNonce) === nonce) {
                foundTx = tx;
                break;
              }
            }
          }
          if (foundTx) break;
        }

        if (foundTx) {
          const pendingTransaction: PendingTransaction = {
            hash: foundTx.hash,
            gasPrice: ethers.formatUnits(foundTx.gasPrice, 'gwei'),
            gasLimit: foundTx.gasLimit.toString(),
            value: ethers.formatEther(foundTx.value),
            to: foundTx.to,
            from: foundTx.from,
            nonce: parseInt(foundTx.nonce)
          };
          setPendingTx(pendingTransaction);
          
          // Suggest higher gas price (20% more than pending tx)
          const suggestedGasPrice = (parseFloat(pendingTransaction.gasPrice) * 1.2).toFixed(0);
          setFormData(prev => ({ ...prev, gasPrice: suggestedGasPrice }));
          return;
        }
      } catch (poolError: any) {
        console.log('txpool_content not supported, trying alternative approach:', poolError.message);
        
        // Fallback: Try to get the transaction by nonce using eth_getTransactionByHash
        // This won't find pending transactions but will help with confirmed ones
        try {
          const currentNonce = await provider.getTransactionCount(walletAddress, 'latest');
          if (nonce < currentNonce) {
            // Nonce is in the past, transaction might be confirmed
            console.log('Nonce is in the past, transaction may be confirmed');
          } else if (nonce === currentNonce) {
            // This is the current nonce, no pending transaction found
            console.log('Current nonce matches, no pending transaction found');
          } else {
            // Nonce is in the future, which is unusual
            console.log('Nonce is in the future, this is unusual');
          }
        } catch (nonceError) {
          console.log('Could not verify nonce status:', nonceError);
        }
      }
      
      // If we get here, no pending transaction was found
      setPendingTx(null);
      
    } catch (err: any) {
      console.error('Failed to fetch pending transaction:', err);
      setPendingTx(null);
    } finally {
      setIsFetchingPendingTx(false);
    }
  };

  // Auto-fetch nonce when RPC URL changes
  useEffect(() => {
    const fetchNonceAndGas = async () => {
      if (formData.rpcUrl && formData.rpcUrl !== 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY') {
        setIsFetchingNonce(true);
        try {
          const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
          
          // Get nonce from MetaMask if available, otherwise from RPC
          let nonce: number;
          if (window.ethereum) {
            try {
              // Request account access first
              await window.ethereum.request({ method: 'eth_requestAccounts' });
              // Get nonce from MetaMask
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
                const signer = await metamaskProvider.getSigner();
                nonce = await signer.getNonce();
                console.log('MetaMask nonce:', nonce);
              } else {
                // Fallback to RPC provider
                nonce = await provider.getTransactionCount(walletAddress, 'pending');
                console.log('RPC nonce:', nonce);
              }
            } catch (metamaskError) {
              console.log('MetaMask not available, using RPC nonce:', metamaskError);
              nonce = await provider.getTransactionCount(walletAddress, 'pending');
              console.log('RPC nonce:', nonce);
            }
          } else {
            // No MetaMask, use RPC provider
            nonce = await provider.getTransactionCount(walletAddress, 'pending');
            console.log('RPC nonce:', nonce);
          }
          
          // Only update nonce if the user hasn't manually entered one
          if (!hasManualNonce) {
            setFormData(prev => ({ ...prev, nonce: nonce.toString() }));
          }
          
          // Fetch current gas price
          const gasPrice = await provider.getFeeData();
          const currentGasPriceGwei = ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
          setGasDetails(prev => ({ ...prev, currentGasPrice: currentGasPriceGwei }));
          
          // Fetch pending transaction details using the nonce (fetched or manual)
          const nonceToUse = hasManualNonce ? parseInt(formData.nonce) : nonce;
          await fetchPendingTransaction(nonceToUse);
          
        } catch (err: any) {
          console.error('Failed to fetch nonce/gas:', err);
        } finally {
          setIsFetchingNonce(false);
        }
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchNonceAndGas, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.rpcUrl, walletAddress]);

  // Fetch pending transaction when nonce changes manually
  useEffect(() => {
    if (formData.nonce && !isFetchingNonce) {
      fetchPendingTransaction(parseInt(formData.nonce));
    }
  }, [formData.nonce]);

  // Calculate gas details when values change
  useEffect(() => {
    const calculateGasDetails = () => {
      try {
        const gasPriceGwei = parseFloat(formData.gasPrice) || 0;
        const gasLimit = parseInt(formData.gasLimit) || 21000;
        const valueEth = parseFloat(formData.value) || 0;
        
        // Calculate total cost in ETH
        const gasCostEth = (gasPriceGwei * gasLimit) / 1e9;
        const totalCostEth = gasCostEth + valueEth;
        
        setGasDetails(prev => ({
          ...prev,
          estimatedGas: gasLimit.toString(),
          totalCost: totalCostEth.toFixed(6)
        }));
      } catch (err) {
        console.error('Failed to calculate gas details:', err);
      }
    };

    calculateGasDetails();
  }, [formData.gasPrice, formData.gasLimit, formData.value]);

  const sendTransaction = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      if (!formData.rpcUrl || !formData.nonce || !formData.gasPrice || !formData.gasLimit) {
        throw new Error('Please fill in all required fields');
      }

      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect MetaMask and try again.');
      }

      // Use the first connected account from MetaMask
      const fromAddress = accounts[0];
      console.log('Using address from MetaMask:', fromAddress);

      // Validate the address
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Invalid Ethereum address from MetaMask');
      }

      // Use ethers.js with MetaMask provider but override nonce
      const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await metamaskProvider.getSigner();
      
      // First, let's see what nonce MetaMask expects
      const expectedNonce = await signer.getNonce();
      console.log('MetaMask expected nonce:', expectedNonce);
      console.log('Our desired nonce:', parseInt(formData.nonce));
      
      // Create transaction object
      const customTx = {
        to: fromAddress,
        value: ethers.parseEther(formData.value),
        nonce: parseInt(formData.nonce), // Force our nonce
        gasPrice: ethers.parseUnits(formData.gasPrice, 'gwei'),
        gasLimit: parseInt(formData.gasLimit)
      };

      console.log('Custom transaction object:', customTx);

      // Try to populate the transaction to see if MetaMask accepts our nonce
      const populatedTx = await signer.populateTransaction(customTx);
      console.log('Populated transaction:', populatedTx);
      
      // Send transaction with explicit nonce
      const transaction = await signer.sendTransaction(populatedTx);
      
      setSuccess(`Transaction sent with nonce ${formData.nonce}! Hash: ${transaction.hash}`);
      
      // Wait for confirmation
      const receipt = await transaction.wait();
      setSuccess(`Transaction confirmed with nonce ${formData.nonce}! Hash: ${transaction.hash}`);
      
    } catch (err: any) {
      console.error('Failed to send transaction:', err);
      
      // Check if user rejected the transaction
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was rejected by user. The nonce shown in MetaMask may be incorrect - the actual transaction will use nonce ' + formData.nonce);
      } else {
        setError(err.message || 'Failed to send transaction');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentNonce = async () => {
    try {
      // Get nonce from MetaMask if available, otherwise from RPC
      let nonce: number;
      if (window.ethereum) {
        try {
          // Request account access first
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          // Get nonce from MetaMask
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
            const signer = await metamaskProvider.getSigner();
            nonce = await signer.getNonce();
            console.log('MetaMask nonce (manual):', nonce);
          } else {
            // Fallback to RPC provider
            const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
            nonce = await provider.getTransactionCount(walletAddress, 'pending');
            console.log('RPC nonce (manual):', nonce);
          }
        } catch (metamaskError) {
          console.log('MetaMask not available, using RPC nonce (manual):', metamaskError);
          const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
          nonce = await provider.getTransactionCount(walletAddress, 'pending');
          console.log('RPC nonce (manual):', nonce);
        }
      } else {
        // No MetaMask, use RPC provider
        const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
        nonce = await provider.getTransactionCount(walletAddress, 'pending');
        console.log('RPC nonce (manual):', nonce);
      }
      
      setFormData(prev => ({ ...prev, nonce: nonce.toString() }));
      setHasManualNonce(false); // Reset manual flag when user explicitly gets nonce
    } catch (err: any) {
      setError('Failed to get current nonce: ' + err.message);
    }
  };

  const openChainlist = () => {
    window.open('https://chainlist.org/', '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Settings className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Transaction Settings</h2>
      </div>

      {/* Pending Transaction Details */}
      {pendingTx && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-5 h-5 text-orange-400" />
            <h3 className="text-orange-300 font-medium">Pending Transaction Found</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-white/60">Hash</p>
              <p className="text-white font-mono text-xs truncate">{pendingTx.hash}</p>
            </div>
            <div>
              <p className="text-white/60">Gas Price</p>
              <p className="text-white font-medium">{pendingTx.gasPrice} Gwei</p>
            </div>
            <div>
              <p className="text-white/60">Gas Limit</p>
              <p className="text-white font-medium">{pendingTx.gasLimit}</p>
            </div>
            <div>
              <p className="text-white/60">Value</p>
              <p className="text-white font-medium">{pendingTx.value} ETH</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-orange-500/20 rounded text-xs text-orange-200">
            💡 Set your gas price higher than {pendingTx.gasPrice} Gwei to replace this transaction
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RPC URL */}
        <div className="md:col-span-2">
          <label className="block text-white/80 text-sm font-medium mb-2">
            RPC URL *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              name="rpcUrl"
              value={formData.rpcUrl}
              onChange={handleInputChange}
              placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
              className="glass-input flex-1"
            />
            <button
              onClick={openChainlist}
              className="glass-button px-4 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Find RPC</span>
            </button>
          </div>
          <p className="text-white/60 text-xs mt-1">
            Auto-fetching nonce, gas price, and pending transaction details...
            {formData.rpcUrl && formData.rpcUrl !== 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY' && (
              <span className="block mt-1 text-orange-300">
                ⚠️ Pending transaction detection may not work with all RPC providers. Set gas price manually if needed.
              </span>
            )}
          </p>
        </div>

        {/* Nonce */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Nonce *
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              name="nonce"
              value={formData.nonce}
              onChange={handleInputChange}
              placeholder="0"
              className="glass-input flex-1"
            />
            <button
              onClick={getCurrentNonce}
              disabled={isFetchingNonce || isFetchingPendingTx}
              className="glass-button px-4 disabled:opacity-50"
            >
              {isFetchingNonce || isFetchingPendingTx ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Get'
              )}
            </button>
          </div>
          <p className="text-white/60 text-xs mt-1">
            Current nonce: {formData.nonce || 'Not set'} • {pendingTx ? 'Pending TX found!' : 'No pending TX found'}
          </p>
        </div>

        {/* Gas Price */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Gas Price (Gwei) *
          </label>
          <input
            type="number"
            name="gasPrice"
            value={formData.gasPrice}
            onChange={handleInputChange}
            placeholder="50"
            className="glass-input w-full"
          />
          <p className="text-white/60 text-xs mt-1">
            {pendingTx 
              ? `Pending TX: ${pendingTx.gasPrice} Gwei • Set higher than this`
              : `Current network gas: ${gasDetails.currentGasPrice ? `${gasDetails.currentGasPrice} Gwei` : 'Loading...'} • Set 20% higher than current gas price to replace pending TX`
            }
          </p>
        </div>

        {/* Gas Limit */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Gas Limit *
          </label>
          <input
            type="number"
            name="gasLimit"
            value={formData.gasLimit}
            onChange={handleInputChange}
            placeholder="21000"
            className="glass-input w-full"
          />
          <p className="text-white/60 text-xs mt-1">
            {pendingTx 
              ? `Pending TX: ${pendingTx.gasLimit} gas • Use same or higher`
              : `Standard ETH transfer: 21,000 gas • Estimated: ${gasDetails.estimatedGas} gas`
            }
          </p>
        </div>

        {/* Value */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Value
          </label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            placeholder="0"
            step="0"
            disabled={true}
            className="glass-input w-full disabled:opacity-50"
          />
          <p className="text-white/60 text-xs mt-1">
              No value needed for this transaction
          </p>
        </div>
      </div>

      {/* Gas Summary */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="text-blue-300 font-medium mb-2">Transaction Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/60">Gas Price</p>
            <p className="text-white font-medium">{formData.gasPrice} Gwei</p>
          </div>
          <div>
            <p className="text-white/60">Gas Limit</p>
            <p className="text-white font-medium">{formData.gasLimit}</p>
          </div>
          <div>
            <p className="text-white/60">Value</p>
            <p className="text-white font-medium">{formData.value} ETH</p>
          </div>
          <div>
            <p className="text-white/60">Total Cost</p>
            <p className="text-white font-medium">{gasDetails.totalCost} ETH</p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-6"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg p-3 mt-6"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300 text-sm">{success}</span>
        </motion.div>
      )}

      {/* Send Button */}
      <motion.button
        onClick={sendTransaction}
        disabled={isLoading}
        className="glass-button w-full mt-6 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Sending Transaction...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Send Transaction to Remove Pending TX</span>
          </>
        )}
      </motion.button>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="text-blue-300 font-medium mb-2">How it works:</h3>
        <ul className="text-blue-200/80 text-sm space-y-1">
          <li>• Set a higher gas price than your pending transaction</li>
          <li>• Use the same nonce as your pending transaction</li>
          <li>• Send a small amount of ETH to yourself</li>
          <li>• This will replace the pending transaction</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default TransactionForm; 