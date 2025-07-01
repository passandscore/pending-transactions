# Pending Transaction Resolver

<div align="center">
  <img src="public/splash.png" alt="Pending Transaction Resolver" width="600" />
</div>

A simple tool that sends zero value transactions to yourself to resolve pending transactions visible on the blockchain or cancel transactions stuck in the mempool.

## What This Tool Does

This tool **only** sends zero value transactions to your own address to:
- **Resolve** pending transactions visible on the blockchain
- **Cancel** transactions stuck in the mempool

Both are accomplished by using the same nonce as your pending/stuck transaction, which effectively replaces it.

## What This Tool Does NOT Do

- ❌ **Does NOT** add additional value to contract calls to speed them up
- ❌ **Does NOT** handle transactions stuck due to insufficient gas
- ❌ **Does NOT** replace transactions with higher gas prices
- ❌ **Does NOT** send transactions to other addresses

## How It Works

1. **Connect** your MetaMask wallet
2. **Set** the nonce of your pending/stuck transaction
3. **Send** a zero value transaction to yourself with the same nonce
4. **Resolve/Cancel** the pending or stuck transaction

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Prerequisites

- **MetaMask** browser extension
- **Ethereum RPC URL** (Alchemy, Infura, etc.)
- **Small ETH balance** for gas fees

## Safety

- **Self-transfers only** - Transactions are sent to your own address
- **Zero value** - No ETH is transferred, only gas fees are paid
- **No private key exposure** - All signing through MetaMask
- **Open source** - Code is publicly auditable

## License

MIT License - feel free to use this tool for your own projects.

---

**Disclaimer**: This tool is for educational and utility purposes. Always verify transaction details before sending. The developers are not responsible for any financial losses. 