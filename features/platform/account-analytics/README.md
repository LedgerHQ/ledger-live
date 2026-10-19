# @features/platform-account-analytics

> [!CAUTION]
> **Status: UNSTABLE** — New package; API may change.

Account-derived analytics properties shared by Ledger Wallet Desktop and Mobile.

Three user properties, from the same account list:

- `getAccountsWithFunds` — native tickers (`ETH`). L2s that use ETH stay `ETH`.
- `getBlockchainsWithFunds` — blockchain names (`Ethereum`, `Arbitrum`, `OP Mainnet`).
- `getTokensWithFunds` — `"USDT on Ethereum"`. A parent without funds drops its tokens.
- `getTokensWithFundsMap` — the same assets, with `ticker`, `networkName` and `id`, for stakeable-asset analytics.

## Usage

```ts
import {
  getAccountsWithFunds,
  getBlockchainsWithFunds,
  getTokensWithFunds,
} from "@features/platform-account-analytics";

const accountsWithFunds = getAccountsWithFunds(accounts);
const blockchainWithFunds = getBlockchainsWithFunds(accounts);
const tokenWithFunds = getTokensWithFunds(accounts);
```

The input is structural (`currency.name` and `balance.gt`). Callers pass their account list without this package depending on the legacy account type.
