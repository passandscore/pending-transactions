# Pending Transaction Remover

A beautiful, liquid glass UI tool designed to help Ethereum users remove stuck or pending transactions from the blockchain.

## 🎨 Features

- **Liquid Glass UI**: Modern, animated interface with glass morphism effects
- **Wallet Integration**: Seamless MetaMask connection
- **Custom RPC Support**: Use any Ethereum RPC provider
- **Gas Management**: Customizable gas price and limit settings
- **Nonce Management**: Automatic nonce fetching and manual override
- **Transaction Replacement**: Safely replace pending transactions with higher gas

## 🚀 How It Works

### What is a Pending Transaction?

A pending transaction occurs when you send a transaction with a gas price that's too low for the current network conditions. The transaction gets stuck in the mempool and never gets mined.

### The Solution: Nonce Replacement

This tool uses Ethereum's nonce system to replace pending transactions:

1. **Nonce System**: Each Ethereum account has a nonce (transaction counter) that must increase sequentially
2. **Replacement Logic**: When you send a new transaction with the same nonce but higher gas price, miners prioritize the higher-paying transaction
3. **Safe Process**: You send a small amount of ETH to yourself with the same nonce but higher gas

### Step-by-Step Process

1. **Connect Wallet**: Link your MetaMask wallet to the application
2. **Configure RPC**: Set your preferred Ethereum RPC endpoint
3. **Set Nonce**: Use the current nonce of your pending transaction
4. **Adjust Gas**: Set a higher gas price than your pending transaction
5. **Send Transaction**: The new transaction replaces the pending one

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Prerequisites

- **MetaMask**: Must be installed in your browser
- **RPC Provider**: You'll need an RPC URL (Alchemy, Infura, etc.)
- **Ethereum Balance**: Small amount of ETH for gas fees

## 🔧 Configuration

### RPC URLs

The tool supports any Ethereum RPC provider. Here are some popular options:

- **Alchemy** (Recommended): `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Infura**: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
- **Public RPC**: `https://eth.llamarpc.com` (less reliable)

### Gas Settings

- **Gas Price**: Should be at least 20% higher than your pending transaction
- **Gas Limit**: Standard ETH transfer uses 21,000 gas
- **Value**: Small amount (0.001 ETH recommended for testing)

## ⚠️ Safety Guidelines

1. **Verify Nonce**: Always double-check the nonce matches your pending transaction
2. **Test First**: Start with small amounts to verify the process works
3. **Reliable RPC**: Use a trusted RPC provider to avoid connection issues
4. **Gas Price**: Ensure your new gas price is significantly higher than the pending transaction
5. **Backup**: Consider backing up your transaction details before proceeding

## 🎯 Use Cases

- **Low Gas Transactions**: Replace transactions sent with insufficient gas
- **Network Congestion**: Handle transactions stuck during high network activity
- **Mempool Issues**: Clear transactions stuck in the mempool
- **Wallet Recovery**: Recover from wallet issues caused by pending transactions

## 🔍 Technical Details

### Why This Works

Ethereum's consensus mechanism ensures that:
- Each account has a sequential nonce
- Only one transaction per nonce can be mined
- Miners prioritize higher gas prices
- New transactions with the same nonce replace old ones

### Security Considerations

- The tool only sends transactions to your own address
- No private keys are ever exposed
- All transactions are signed through MetaMask
- The process is transparent and verifiable

## 🎨 UI Features

- **Glass Morphism**: Modern translucent design with backdrop blur
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Feedback**: Live status updates and error handling
- **Accessibility**: Keyboard navigation and screen reader support

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

## 📄 License

MIT License - feel free to use this tool for your own projects.

## ⚡ Quick Start

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Open your browser to `http://localhost:5173`
5. Connect your MetaMask wallet
6. Configure your RPC URL and gas settings
7. Send a transaction to replace your pending one

---

**Disclaimer**: This tool is for educational and utility purposes. Always verify transaction details before sending. The developers are not responsible for any financial losses. 