# wallet-api-exchange-module

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

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
- `getTronifyQuote` / `createTronifyRentRecord` / `uploadTronifyHash` / `isTronifyEnergyDelivered` — rent TRON energy from Tronify for a TRC-20 swap (see below)

## Tronify energy rental before a TRON swap

A TRC-20 swap can rent its energy from Tronify instead of burning TRX:

1. `getTronifyQuote({ fromAccountId, recipient, amount })` returns the rent (`value`, in `feeAsset` base units) and the TRX burn it replaces (`originalValue`, in sun).
2. `createTronifyRentRecord({ fromAccountId, recipient, amount, approvedFee })` creates the order, with `approvedFee` the quote `value` the user approved. It returns the unsigned rent payment (`rawTransaction`) and the `energyNeeded` for step 5.
3. Sign `rawTransaction` with `transaction.signRaw` and `broadcast: false`. **The Live App must never broadcast the rent payment.**
4. `uploadTronifyHash({ fromAccountId, orderId, signedTransactionHex })` sends the signed payment to Tronify, which broadcasts it and delegates the energy.
5. Poll `isTronifyEnergyDelivered({ fromAccountId, energyNeeded })` until `delivered` is `true`. The fee estimate cannot tell when the energy has arrived: after the rental it can remain above zero, because the transfer can burn TRX for bandwidth.
6. Call `completeSwap`.

`delivered: true` means only that the account's available energy covers `energyNeeded`. It does not tie the energy to a rent order, and it does not mean the swap will pass validation. `completeSwap` still fails with `NotEnoughGas` when the account cannot pay a bandwidth burn.

The Live App manifest must list in `permissions` the four `custom.exchange.tronify.*` methods and `transaction.signRaw`.

## Usage context

Used by Live Apps (dApps embedded in Ledger Live) that need to perform asset exchanges. The Ledger Live host implements the matching RPC handlers; this module is the client-side counterpart bundled with the Live App.
