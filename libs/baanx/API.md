# Baanx API Reference

> **Base URL:** `https://ledger.baanxapi.com`
>
> **Authentication:** Raw token in `authorization` header (no `Bearer` prefix).
> Token is extracted from the Baanx WebView `localStorage` after user login.

## Common Headers

All requests include the following headers:

| Header | Value |
|--------|-------|
| `authorization` | `<access_token>` |
| `Accept` | `application/json, text/plain, */*` |
| `X-Request-Origin` | `Standalone https://ledger-ui.baanx.co.uk` |
| `X-Product-Version` | `999` |
| `X-Platform` | `web` |
| `X-product` | `LEDGER` |

---

## Endpoints

### 1. Get User Card

Check if the user has a card and get provider details.

```
GET /iframe/api/v2/user/card
```

**Parameters:** None

**Response:**

```json
{
  "hasCard": true,
  "details": {
    "provider": "monavate"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hasCard` | `boolean` | Whether the user has an active card |
| `details.provider` | `string` | Card provider name (e.g. `"monavate"`) |

---

### 2. Get User Wallets

Retrieve all crypto wallets linked to the user's account.

```
GET /iframe/api/v2/user/wallets
```

**Parameters:** None

**Response:**

```json
{
  "wallets": [
    {
      "coin": "btc",
      "coin_ledger_name": "Bitcoin",
      "address": "bc1qpywg0rr8eqy6wvxmscajca0gpwuffzvz275suf9...",
      "balance": "1129",
      "source_market_rate": {
        "BNBBTC": {
          "ask": "0.00836016889...",
          "baseSymbol": "BNB"
        }
      }
    },
    {
      "coin": "usdc",
      "coin_ledger_name": "USDC",
      "address": "0x2795da5f8f1e766e552339edff6193d73f1323c0",
      "balance": "1039915922"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `wallets` | `Wallet[]` | Array of user wallets |
| `wallets[].coin` | `string` | Coin ticker lowercase (e.g. `"btc"`, `"usdc"`) |
| `wallets[].coin_ledger_name` | `string?` | Human-readable name (e.g. `"Bitcoin"`) |
| `wallets[].address` | `string` | Wallet address |
| `wallets[].balance` | `string` | Balance in **atomic units** (satoshis, wei, etc.) |
| `wallets[].source_market_rate` | `object?` | Market rate pairs available for this wallet |

> **Note:** Balances are in atomic units. Divide by `10^decimals` to get human-readable values:
> BTC=8, ETH=18, USDC=8, USDT=8, SOL=9, XRP=6, EUR=2, GBP=2, EURT=6, BXX=18

---

### 3. Get Loans

Retrieve active loans / stableloans for the user.

```
GET /iframe/api/v2/loans
```

**Parameters:** None

**Response:**

```json
{
  "loans": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `loans` | `Loan[]` | Array of active loans (empty if none) |

---

### 4. Get Staking Deals

Retrieve staking deals for the user.

```
GET /iframe/api/v2/staking_deals
```

**Parameters:** None

**Response:**

```json
{
  "staking_deals": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `staking_deals` | `StakingDeal[]` | Array of staking deals |

---

### 5. Get Settings

Retrieve user settings and preferences.

```
GET /iframe/api/v2/new_settings
```

**Parameters:** None

**Response:**

```json
{
  "fiat_currency": "EUR",
  "...": "..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `fiat_currency` | `string?` | User's preferred fiat currency |

---

### 6. Get Wallet Transactions

Retrieve paginated crypto transactions for a specific wallet.

```
GET /iframe/api/v2/user/wallet/address/{address}/{coin}/transactions/paginated
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | Wallet address (URL-encoded) |
| `coin` | `string` | Coin ticker (e.g. `"btc"`, `"usdc"`) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `0` | Page number (0-indexed) |

**Response:**

```json
{
  "transactions": [
    {
      "id": "c329674f-0b91-41d8-a9aa-0374e3789172",
      "source_address": "bc1qpywg0rr8eqy6wvxmscajca0gpwuff...",
      "destination_address": "...",
      "source_currency": "btc",
      "destination_currency": "btc",
      "source_user": "18fe147a-4585-4f3e-98c9-159cd02334b1",
      "destination_user": null,
      "confirmed_amount": "0",
      "total_amount": "60084078",
      "transaction_state": "pending",
      "transaction_fee": "0",
      "transaction_type": "send",
      "display_amount": "60084078",
      "base_amount": "60084078",
      "internal_fee": "0",
      "crypto_card_spread": "0",
      "on_chain_network": null,
      "ledger_hash": "",
      "source_market_rate": { "...": "..." }
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `transactions` | `Transaction[]` | Array of wallet transactions |
| `transactions[].id` | `string` | Transaction UUID |
| `transactions[].source_address` | `string` | Sender address |
| `transactions[].destination_address` | `string?` | Receiver address |
| `transactions[].source_currency` | `string` | Source coin ticker |
| `transactions[].destination_currency` | `string` | Destination coin ticker |
| `transactions[].source_user` | `string` | Source user UUID |
| `transactions[].destination_user` | `string?` | Destination user UUID |
| `transactions[].confirmed_amount` | `string` | Confirmed amount (atomic units) |
| `transactions[].total_amount` | `string` | Total amount (atomic units) |
| `transactions[].display_amount` | `string` | Display amount (atomic units) |
| `transactions[].base_amount` | `string` | Base amount (atomic units) |
| `transactions[].transaction_state` | `string` | State: `"pending"`, `"confirmed"`, `"failed"` |
| `transactions[].transaction_fee` | `string` | Fee (atomic units) |
| `transactions[].transaction_type` | `string` | Type: `"send"`, `"receive"`, etc. |
| `transactions[].internal_fee` | `string` | Internal fee (atomic units) |
| `transactions[].crypto_card_spread` | `string` | Spread applied |
| `transactions[].on_chain_network` | `string?` | Blockchain network |
| `transactions[].ledger_hash` | `string` | On-chain transaction hash |
| `transactions[].source_market_rate` | `object?` | Market rates at time of transaction |

---

### 7. Get Card Balance

Retrieve the card's Monavate balance.

```
GET /api/v1/card/monavate/balance
```

**Parameters:** None

**Response:**

```json
{
  "availableBalance": {
    "amount": -3.5,
    "currencyCode": "EUR"
  },
  "balance": {
    "amount": 0,
    "currencyCode": "EUR"
  },
  "complianceAvailableBalance": {
    "amount": -3.5,
    "currencyCode": "EUR"
  },
  "complianceBalance": {
    "amount": 0,
    "currencyCode": "EUR"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `availableBalance.amount` | `number` | Available balance (can be negative) |
| `availableBalance.currencyCode` | `string` | Currency code (e.g. `"EUR"`) |
| `balance.amount` | `number` | Current balance |
| `balance.currencyCode` | `string` | Currency code |
| `complianceAvailableBalance` | `object` | Compliance-adjusted available balance |
| `complianceBalance` | `object` | Compliance-adjusted balance |

> **Note:** This is the Monavate card provider balance, not the total portfolio value.
> The total portfolio value (e.g. 9.53 EUR) is computed by summing all wallet balances
> converted to EUR using market rates.

---

### 8. Get Card Transactions (Monavate)

Retrieve paginated card payment transactions (POS purchases, ATM, etc.).

```
GET /api/v1/card/monavate/transactions
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageNumber` | `number` | `0` | Page number (0-indexed) |
| `pageSize` | `number` | `50` | Results per page |
| `includeDeclined` | `number` | `1` | Include declined transactions (`1`=yes) |
| `from_date` | `string` | 90 days ago | Start date `YYYY-MM-DD` |
| `to_date` | `string` | today | End date `YYYY-MM-DD` |

**Response:**

```json
{
  "transactions": [
    {
      "id": "7647283c-3307-453f-81e4-3fe924edc60e",
      "card_id": "6424025720541399200",
      "reversalAuthorizationId": null,
      "merchantNameLocation": "FILON, MONTREUIL",
      "amountTransactionCurrency": 0.5,
      "merchantType": "InWalletPOS",
      "originalTransactionCurrency": "EUR"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `transactions` | `CardTransaction[]` | Array of card transactions |
| `transactions[].id` | `string` | Transaction UUID |
| `transactions[].card_id` | `string` | Card identifier |
| `transactions[].merchantNameLocation` | `string` | Merchant name and location |
| `transactions[].merchantType` | `string` | Merchant type (e.g. `"InWalletPOS"`) |
| `transactions[].amountTransactionCurrency` | `number` | Amount in transaction currency |
| `transactions[].originalTransactionCurrency` | `string` | Currency code (e.g. `"EUR"`) |
| `transactions[].reversalAuthorizationId` | `string?` | Reversal ID if applicable |

---

### 9. Get Card Transaction Detail

Retrieve details for a specific card transaction.

```
GET /iframe/api/v2/card/transaction/{transactionId}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `transactionId` | `string` | Transaction UUID |

**Response:**

```json
{
  "id": "534eef28-479e-481f-bc6e-f7c7103a2cdf",
  "confirmed_amount": "0",
  "total_amount": "60084078",
  "source_currency": "usdc",
  "source_address": "0x2795da5f8f1e766e552339edff6193d73f1323c0",
  "transaction_state": "pending",
  "transaction_fee": "0",
  "on_chain_network": null,
  "ledger_hash": "",
  "base_amount": "60084078",
  "internal_fee": "0",
  "crypto_card_spread": "0",
  "source_user": "18fe147a-4585-4f3e-98c9-159cd02334b1",
  "transaction_type": "send",
  "display_amount": "60084078"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Transaction UUID |
| `confirmed_amount` | `string` | Confirmed amount (atomic units) |
| `total_amount` | `string` | Total amount (atomic units) |
| `source_currency` | `string` | Source coin ticker |
| `source_address` | `string` | Source wallet address |
| `transaction_state` | `string` | Transaction state |
| `transaction_fee` | `string` | Fee (atomic units) |
| `on_chain_network` | `string?` | Network name |
| `ledger_hash` | `string` | On-chain hash |
| `base_amount` | `string` | Base amount before fees |
| `internal_fee` | `string` | Internal fee |
| `crypto_card_spread` | `string` | Spread applied |
| `source_user` | `string` | User UUID |
| `transaction_type` | `string` | Type: `"send"`, `"receive"` |
| `display_amount` | `string` | Display amount |

---

### 10. Get Card Transaction Funding Sources

Retrieve funding sources used for a specific card transaction.

```
GET /iframe/api/v2/card/transaction/{transactionId}/funding_sources
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `transactionId` | `string` | Transaction UUID |

**Response:**

```json
[
  {
    "id": "534eef28-479e-481f-bc6e-f7c7103a2cdf",
    "confirmed_amount": "0",
    "total_amount": "60084078",
    "source_currency": "usdc",
    "source_address": "0x2795da5f8f1e766e552339edff6193d73f1323c0",
    "transaction_state": "pending",
    "transaction_fee": "0",
    "transaction_type": "send",
    "display_amount": "60084078"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| (array) | `FundingSource[]` | Array of funding source transactions |

Each funding source has the same schema as a transaction detail (see endpoint 9).

---

### 11. Check Card PIN Status

Check if the user has set up a PIN for their card.

```
GET /iframe/api/v2/card/monavate/checkPIN
```

**Parameters:** None

**Response:**

```json
{
  "hasPIN": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hasPIN` | `boolean` | Whether a PIN has been configured |

---

## RTK Query Hooks (low-level)

All endpoints are exposed as React hooks via `@ledgerhq/baanx`:

```typescript
import {
  useGetUserCardQuery,
  useGetUserWalletsQuery,
  useGetLoansQuery,
  useGetStakingDealsQuery,
  useGetSettingsQuery,
  useGetWalletTransactionsQuery,
  useGetCardBalanceQuery,
  useGetCardTransactionsQuery,
  useGetCardTransactionDetailQuery,
  useGetCardTransactionFundingSourcesQuery,
  useGetCheckPINQuery,
} from "@ledgerhq/baanx";
```

---

## Custom Hooks (high-level, shared desktop & mobile)

These hooks encapsulate business logic and can be used identically on both platforms.

```typescript
import {
  useCardTotalBalance,
  useCardTransactions,
  useCardTransactionFundingSources,
  useAggregatedWalletTransactions,
  useCardInfo,
  useEurRates,
} from "@ledgerhq/baanx";
```

### 1. `useCardTotalBalance(accessToken)`

Computes the total portfolio value across all Baanx wallets, converting each crypto balance to EUR via CoinGecko rates.

```typescript
const {
  wallets,         // WalletBalance[] — per-wallet breakdown
  totalFiatValue,  // number | null — sum of all fiat values
  fiatCurrency,    // string — user's fiat currency (from settings)
  isLoading,       // boolean
} = useCardTotalBalance(accessToken);
```

**`WalletBalance`:**

| Field | Type | Description |
|-------|------|-------------|
| `coin` | `string` | Coin ticker (e.g. `"btc"`) |
| `coinName` | `string?` | Human name (e.g. `"Bitcoin"`) |
| `balance` | `number` | Human-readable balance (already divided by decimals) |
| `fiatValue` | `number \| null` | Value in fiat currency, or `null` if rate unavailable |

---

### 2. `useCardTransactions(accessToken)`

Fetches card payment transactions (POS purchases, ATM withdrawals, etc.) from Monavate.

```typescript
const {
  transactions,  // CardTransaction[]
  isLoading,     // boolean
  error,         // unknown
} = useCardTransactions(accessToken);
```

**`CardTransaction`:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Transaction UUID |
| `cardId` | `string?` | Card identifier |
| `merchantName` | `string` | Merchant name + location (e.g. `"FILON, MONTREUIL"`) |
| `merchantType` | `string` | Merchant type (e.g. `"InWalletPOS"`) |
| `amount` | `number` | Amount in transaction currency |
| `currency` | `string` | Currency code (e.g. `"EUR"`) |
| `state` | `string` | Transaction state |
| `date` | `string \| null` | ISO date string |
| `reversalId` | `string \| null` | Reversal authorization ID |
| `raw` | `Record<string, unknown>` | Full raw API response for this transaction |

---

### 3. `useCardTransactionFundingSources(accessToken, transactionId)`

Fetches funding sources for a specific card transaction.

```typescript
const {
  sources,    // FundingSource[] — array of funding source records
  isLoading,  // boolean
  error,      // unknown
} = useCardTransactionFundingSources(accessToken, transactionId);
```

Each `FundingSource` is a `Record<string, unknown>` containing all fields from the API.

---

### 4. `useAggregatedWalletTransactions(accessToken)`

Fetches crypto transactions from **all** user wallets and aggregates them into a single sorted list.

> **Note:** This hook requires rendering `<WalletTxCollector>` components (one per wallet) to
> fetch each wallet's transactions. Use the `wallets` array and `WalletTxCollector` export.

```typescript
const {
  transactions,   // WalletTransaction[] — sorted by date (newest first)
  wallets,        // WalletInfo[] — list of user wallets
  isLoading,      // boolean
  loadedWallets,  // number — how many wallets have been loaded
} = useAggregatedWalletTransactions(accessToken);
```

**`WalletTransaction`:**

| Field | Type | Description |
|-------|------|-------------|
| `walletCoin` | `string` | Coin name (e.g. `"Bitcoin"`) |
| `walletAddress` | `string` | Wallet address |
| `raw` | `Record<string, unknown>` | Full raw transaction data |

**`WalletInfo`:**

| Field | Type | Description |
|-------|------|-------------|
| `address` | `string` | Wallet address |
| `coin` | `string` | Coin ticker |
| `coinName` | `string?` | Human-readable coin name |

---

### 5. `useCardInfo(accessToken)`

Combines card status, Monavate balance, and user settings into one hook.

```typescript
const {
  hasCard,          // boolean — whether user has an active card
  provider,         // string | null — card provider (e.g. "monavate")
  monavateBalance,  // { available, balance, currency } | null
  fiatCurrency,     // string — user's preferred fiat currency
  isLoading,        // boolean
} = useCardInfo(accessToken);
```

**`monavateBalance`:**

| Field | Type | Description |
|-------|------|-------------|
| `available` | `number` | Available balance (can be negative) |
| `balance` | `number` | Current balance |
| `currency` | `string` | Currency code (e.g. `"EUR"`) |

---

### 6. `useEurRates(coins)`

Low-level hook that fetches EUR exchange rates from CoinGecko for a list of coin tickers.

```typescript
const rates = useEurRates(["btc", "eth", "usdc"]);
// rates = { btc: 63000, eth: 3100, usdc: 0.85, eur: 1, eurt: 1 }
```

Supported coins: `btc`, `eth`, `usdc`, `usdt`, `sol`, `xrp`, `bxx`. Fiat coins (`eur`, `eurt`) always return `1`.

---

## Example: Full card screen (desktop or mobile)

```typescript
import {
  useCardInfo,
  useCardTotalBalance,
  useCardTransactions,
} from "@ledgerhq/baanx";

function CardScreen({ accessToken }: { accessToken: string }) {
  const card = useCardInfo(accessToken);
  const balance = useCardTotalBalance(accessToken);
  const { transactions, isLoading } = useCardTransactions(accessToken);

  if (card.isLoading || balance.isLoading) return <Loading />;

  return (
    <View>
      {/* Card status */}
      <Text>Card: {card.hasCard ? "Active" : "No card"}</Text>
      <Text>Provider: {card.provider}</Text>

      {/* Total portfolio balance */}
      <Text>
        Total: {balance.totalFiatValue?.toFixed(2)} {balance.fiatCurrency}
      </Text>

      {/* Per-wallet breakdown */}
      {balance.wallets.map(w => (
        <Text key={w.coin}>
          {w.coin.toUpperCase()}: {w.balance} ({w.fiatValue?.toFixed(2)} {balance.fiatCurrency})
        </Text>
      ))}

      {/* Card transactions */}
      {transactions.map(tx => (
        <Text key={tx.id}>
          {tx.merchantName} — {tx.amount} {tx.currency}
        </Text>
      ))}
    </View>
  );
}
```

---

## Authentication Flow

1. User opens the Baanx WebView (`https://ledger-ui.baanx.co.uk`)
2. User authenticates in the WebView
3. Injected JavaScript extracts the `access_token` from `localStorage`
4. Token is passed to all API calls via the `authorization` header (raw, no `Bearer`)

---

## API Base URLs

| Environment | URL | Notes |
|-------------|-----|-------|
| Production | `https://ledger.baanxapi.com` | Ledger-specific Baanx API |
| Monavate (v1) | `https://ledger.baanxapi.com/api/v1/` | Card balance & card transactions |
| Iframe (v2) | `https://ledger.baanxapi.com/iframe/api/v2/` | Wallets, loans, settings, crypto transactions |
