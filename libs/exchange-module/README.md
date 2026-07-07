# wallet-api-exchange-module

`@ledgerhq/wallet-api-exchange-module` is a [Wallet API](https://github.com/LedgerHQ/wallet-api) `CustomModule` that exposes swap, sell, and fund exchange flows to Live Apps running inside Ledger Live. It lets dApps initiate exchange transactions through Ledger Live's built-in exchange service without implementing device signing themselves.

## What it does

- Extends `CustomModule` from `@ledgerhq/wallet-api-client` with exchange-specific RPC methods
- Handles the two-phase exchange flow: `start*` (get a nonce from the device) → `complete*` (sign and broadcast)
- Supports **swap**, **sell**, and **fund** exchange types
- Provides quote fetching (`getQuotes`) and transaction status polling (`getTransactionStatus`)
- Exposes a `customSwap` method for the device-intent-based swap flow

## Key exports / concepts

- `ExchangeModule` — the main class; instantiated with a `WalletAPIClient` and used by Live Apps
- `startSwap / startSell / startFund` — begin an exchange, returns a `transactionId`
- `completeSwap / completeSell / completeFund` — finalize with signed payload; returns `transactionHash`
- `swap` — single-call swap using the newer `custom.exchange.swap` RPC
- `getQuotes` / `getTransactionStatus` — communicate with the Ledger swap backend via the host
- `throwExchangeErrorToLedgerLive` — surface exchange errors in the Ledger Live UI

## Usage context

Used by Live Apps (dApps embedded in Ledger Live) that need to perform asset exchanges. The Ledger Live host implements the matching RPC handlers; this module is the client-side counterpart bundled with the Live App.
