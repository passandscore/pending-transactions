import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, Send, AlertCircle, CheckCircle, ExternalLink, Clock, Info, Eye, Skull, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [walletNonce, setWalletNonce] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

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

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
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

  // Get nonce from MetaMask or RPC
  const getNonce = async (): Promise<number> => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await metamaskProvider.getSigner();
          const nonce = await signer.getNonce();
          setWalletNonce(nonce);
          return nonce;
        }
      } catch (metamaskError) {
        console.log('MetaMask not available, using RPC nonce:', metamaskError);
      }
    }
    
    // Fallback to RPC provider
    const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
    const nonce = await provider.getTransactionCount(walletAddress, 'pending');
    setWalletNonce(nonce);
    return nonce;
  };

  // Auto-fetch nonce when RPC URL changes
  useEffect(() => {
    const fetchNonceAndGas = async () => {
      if (formData.rpcUrl && formData.rpcUrl !== 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY') {
        setIsFetchingNonce(true);
        try {
          const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
          
          // Get nonce
          const nonce = await getNonce();
          
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

      // Use ethers.js with MetaMask provider
      const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await metamaskProvider.getSigner();
      
      // Get network info for block explorer URL
      const network = await metamaskProvider.getNetwork();
      const blockExplorerUrl = (network as any).getBlockExplorerUrl?.() || null;
      
      // Create transaction object
      const customTx = {
        to: fromAddress,
        value: ethers.parseEther(formData.value),
        nonce: parseInt(formData.nonce),
        gasPrice: ethers.parseUnits(formData.gasPrice, 'gwei'),
        gasLimit: parseInt(formData.gasLimit)
      };

      console.log('Custom transaction object:', customTx);

      // Populate the transaction
      const populatedTx = await signer.populateTransaction(customTx);
      console.log('Populated transaction:', populatedTx);
      
      // Send transaction with explicit nonce
      const transaction = await signer.sendTransaction(populatedTx);
      
      const explorerLink = blockExplorerUrl ? `${blockExplorerUrl}/tx/${transaction.hash}` : transaction.hash;
      setSuccess(`Transaction sent with nonce ${formData.nonce}!<br>Hash: ${explorerLink}`);
      
      // Wait for confirmation
      await transaction.wait();
      setSuccess(`Transaction confirmed with nonce ${formData.nonce}!<br>Hash: ${explorerLink}`);
      
    } catch (err: any) {
      console.error('Failed to send transaction:', err);
      
      // Check if user rejected the transaction
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was rejected by user');
      } else {
        setError(err.message || 'Failed to send transaction');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentNonce = async () => {
    try {
      const nonce = await getNonce();
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
      className="bg-black/90 backdrop-blur-sm border border-gray-900/50 rounded-xl p-6 shadow-2xl shadow-black/50"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-900/30 border border-red-800/50 rounded-lg">
            <Skull className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 tracking-wider">PENDING TRANSACTION RESOLVER</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-gray-200 px-3 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 hover:border-gray-600 text-sm"
        >
          <Info className="w-4 h-4" />
          <span>What is this?</span>
        </button>
      </div>

      {/* Nonce Warning */}
      {walletNonce !== null && parseInt(formData.nonce) !== walletNonce && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-900/20 border border-amber-800/30 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="w-5 h-5 text-amber-500" />
            <h3 className="text-amber-400 font-medium tracking-wide">NONCE DISCREPANCY DETECTED</h3>
          </div>
          <p className="text-gray-400 text-sm">
            Wallet displays nonce {walletNonce}, but execution will use nonce {formData.nonce}. 
            <span className="text-amber-300"> Proceed with caution.</span>
          </p>
        </motion.div>
      )}

      {/* Pending Transaction Details */}
      {pendingTx && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-5 h-5 text-red-500" />
            <h3 className="text-red-400 font-medium tracking-wide">PENDING TRANSACTION FOUND</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Hash</p>
              <p className="text-gray-300 font-mono text-xs truncate">{pendingTx.hash}</p>
            </div>
            <div>
              <p className="text-gray-500">Gas Price</p>
              <p className="text-gray-300 font-medium">{pendingTx.gasPrice} Gwei</p>
            </div>
            <div>
              <p className="text-gray-500">Gas Limit</p>
              <p className="text-gray-300 font-medium">{pendingTx.gasLimit}</p>
            </div>
            <div>
              <p className="text-gray-500">Value</p>
              <p className="text-gray-300 font-medium">{pendingTx.value} ETH</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-red-900/30 rounded text-xs text-red-300 border border-red-800/50">
            ⚠️ SET GAS PRICE HIGHER THAN {pendingTx.gasPrice} GWEI TO REPLACE THIS TRANSACTION
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RPC URL */}
        <div className="md:col-span-2">
          <label className="block text-gray-400 text-sm font-medium mb-2 tracking-wide">
            RPC ENDPOINT *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              name="rpcUrl"
              value={formData.rpcUrl}
              onChange={handleInputChange}
              placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
              className="bg-gray-900/80 border border-gray-800 text-gray-200 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 flex-1"
            />
            <button
              onClick={openChainlist}
              className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-gray-200 px-4 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 hover:border-gray-600"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">FIND RPC</span>
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-1">
            Scanning for nonce, gas price, and pending transactions...
            {formData.rpcUrl && formData.rpcUrl !== 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY' && (
              <span className="block mt-1 text-red-400">
                ⚠️ Pending transaction detection may fail with certain RPC providers. Manual gas price setting recommended.
              </span>
            )}
          </p>
        </div>

        {/* Nonce */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 tracking-wide">
            NONCE *
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              name="nonce"
              value={formData.nonce}
              onChange={handleInputChange}
              placeholder="0"
              className="bg-gray-900/80 border border-gray-800 text-gray-200 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 flex-1"
            />
            <button
              onClick={getCurrentNonce}
              disabled={isFetchingNonce || isFetchingPendingTx}
              className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-gray-200 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-600"
            >
              {isFetchingNonce || isFetchingPendingTx ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
              ) : (
                'CURRENT NONCE'
              )}
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-1">
            {walletNonce !== null && `Wallet nonce: ${walletNonce} • `}
            {pendingTx ? 'Pending transaction found!' : 'No pending transactions found'}
          </p>
        </div>

        {/* Gas Price */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 tracking-wide">
            GAS PRICE (GWEI) *
          </label>
          <input
            type="number"
            name="gasPrice"
            value={formData.gasPrice}
            onChange={handleInputChange}
            placeholder="50"
            className="bg-gray-900/80 border border-gray-800 text-gray-200 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 w-full"
          />
          <p className="text-gray-600 text-xs mt-1">
            {pendingTx 
              ? `Pending tx gas: ${pendingTx.gasPrice} Gwei • Exceed to resolve`
              : `Network gas: ${gasDetails.currentGasPrice ? `${gasDetails.currentGasPrice} Gwei` : 'Scanning...'} • Set 20% higher to resolve pending transactions`
            }
          </p>
        </div>

        {/* Gas Limit */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 tracking-wide">
            GAS LIMIT *
          </label>
          <input
            type="number"
            name="gasLimit"
            value={formData.gasLimit}
            onChange={handleInputChange}
            placeholder="21000"
            className="bg-gray-900/80 border border-gray-800 text-gray-200 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 w-full"
          />
          <p className="text-gray-600 text-xs mt-1">
            {pendingTx 
              ? `Pending tx limit: ${pendingTx.gasLimit} gas • Match or exceed`
              : `Standard transfer: 21,000 gas • Estimated: ${gasDetails.estimatedGas} gas`
            }
          </p>
        </div>

        {/* Value */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 tracking-wide">
            VALUE
          </label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            placeholder="0"
            step="0"
            disabled={true}
            className="bg-gray-900/80 border border-gray-800 text-gray-200 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-gray-600 text-xs mt-1">
              No value required.
          </p>
        </div>
      </div>

      {/* Gas Summary */}
      {/* <div className="mt-6 p-4 bg-gray-900/60 border border-gray-800/50 rounded-lg">
        <h3 className="text-gray-300 font-medium mb-2 tracking-wide">TRANSACTION REPLACEMENT SUMMARY</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Gas Price</p>
            <p className="text-gray-300 font-medium">{formData.gasPrice} Gwei</p>
          </div>
          <div>
            <p className="text-gray-500">Gas Limit</p>
            <p className="text-gray-300 font-medium">{formData.gasLimit}</p>
          </div>
          <div>
            <p className="text-gray-500">Value</p>
            <p className="text-gray-300 font-medium">{formData.value} ETH</p>
          </div>
          <div>
            <p className="text-gray-500">Total Cost</p>
            <p className="text-gray-300 font-medium">{gasDetails.totalCost} ETH</p>
          </div>
        </div>
      </div> */}

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 bg-red-900/20 border border-red-800/30 rounded-lg p-3 mt-6"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 bg-green-900/20 border border-green-800/30 rounded-lg p-3 mt-6"
        >
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-400 text-sm">{success.split('\n').map((line, index) => (
            <span key={index}>{line}<br /></span>
          ))}</span>
        </motion.div>
      )}

      {/* Send Button */}
      <motion.button
        onClick={sendTransaction}
        disabled={isLoading}
        className="bg-gradient-to-r from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 border border-red-700/50 text-gray-200 hover:text-white w-full mt-6 py-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium tracking-wide shadow-lg shadow-red-900/20"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
            <span>RESOLVING PENDING TRANSACTION...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>RESOLVE PENDING TRANSACTION</span>
          </>
        )}
      </motion.button>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-900/60 border border-gray-800/50 rounded-lg">
        <h3 className="text-gray-300 font-medium mb-2 tracking-wide">PENDING TRANSACTION RESOLUTION PROTOCOL:</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Exceed the pending transaction's gas price to resolve it</li>
          <li>• Use the same nonce as the pending transaction</li>
          <li>• Send minimal ETH to yourself</li>
          <li>• The pending transaction will be resolved</li>
        </ul>
      </div>

      {/* What is this Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900/95 border border-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-100">Transaction Replacement Tool</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* What */}
                <div className="border border-gray-800 rounded-lg">
                  <button
                    onClick={() => toggleAccordion('what')}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <h3 className="text-gray-200 font-medium">What is this tool?</h3>
                    {openAccordion === 'what' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openAccordion === 'what' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-gray-400 text-sm leading-relaxed">
                        This tool allows you to resolve pending Ethereum transactions that are stuck in the mempool. 
                        When you send a transaction with the same nonce but a higher gas price, it can resolve the 
                        original transaction before it gets validated. This is useful for canceling unwanted transactions 
                        or speeding up slow ones.
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed mt-2">
                        <strong>💡 Pro Tip:</strong> Some transactions simply hang as pending due to network issues, 
                        wallet problems, or other technical glitches. For these cases, sending a <strong>zero-value 
                        transaction to yourself</strong> can often resolve the issue and clear the pending state.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Why */}
                <div className="border border-gray-800 rounded-lg">
                  <button
                    onClick={() => toggleAccordion('why')}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <h3 className="text-gray-200 font-medium">Why would I need this?</h3>
                    {openAccordion === 'why' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openAccordion === 'why' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <div className="text-gray-400 text-sm space-y-2">
                        <p>You might need this tool when:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>You sent a transaction with too low gas price and it's stuck</li>
                          <li>You want to cancel a transaction you no longer want</li>
                          <li>You made an error in a transaction and want to replace it</li>
                          <li>You need to fix a pending/hanging transaction</li>
                          <li>You have a transaction that simply hangs as pending (network/wallet issues)</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* When */}
                <div className="border border-gray-800 rounded-lg">
                  <button
                    onClick={() => toggleAccordion('when')}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <h3 className="text-gray-200 font-medium">When does this work?</h3>
                    {openAccordion === 'when' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openAccordion === 'when' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <div className="text-gray-400 text-sm space-y-2">
                        <p>Transaction resolution works when:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>The original transaction is still pending (not validated)</li>
                          <li>You use the same nonce as the original transaction</li>
                          <li>You set a higher gas price than the original</li>
                          <li>The network isn't too congested</li>
                        </ul>
                        <p className="mt-2 text-amber-400">
                          ⚠️ Once a transaction is validated, it cannot be replaced or canceled.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* How */}
                <div className="border border-gray-800 rounded-lg">
                  <button
                    onClick={() => toggleAccordion('how')}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <h3 className="text-gray-200 font-medium">How does it work?</h3>
                    {openAccordion === 'how' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openAccordion === 'how' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <div className="text-gray-400 text-sm space-y-2">
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Enter your RPC endpoint to connect to the blockchain</li>
                          <li>Set the nonce to match your pending transaction</li>
                          <li>Set a gas price higher than the pending transaction</li>
                          <li>Set an appropriate gas limit (usually 21,000 for simple transfers)</li>
                          <li>Send a small amount of ETH to yourself (0 ETH is fine for hanging transactions)</li>
                          <li>Submit the transaction through MetaMask</li>
                        </ol>
                        <p className="mt-2">
                          The new transaction will replace the old one because it has the same nonce but higher gas price.
                        </p>
                        <p className="mt-2 text-amber-400">
                          <strong>Note:</strong> For transactions that simply hang as pending, you can use 0 ETH value 
                          to "unstick" them by advancing the nonce.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransactionForm; 