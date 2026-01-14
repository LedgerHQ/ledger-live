# Light EVM Integration Guide

**How to add a new EVM L2/sidechain to Ledger Live with minimal code changes.**

## Overview

A "Light EVM Integration" is a streamlined process for adding EVM-compatible L2s (Layer 2s) or sidechains to Ledger Live. These networks use the existing `coin-evm` module infrastructure and only require configuration changes across the monorepo - no new coin module code is needed.

**Reference Commit:** [`9659a34d99`](https://github.com/LedgerHQ/ledger-live/commit/9659a34d99) (Somnia integration)

## Prerequisites

Before starting a light EVM integration, ensure:

1. The network is EVM-compatible (uses Ethereum JSON-RPC API)
2. The [Ethereum embedded app](https://github.com/LedgerHQ/app-ethereum) supports the network's chain ID
3. You have access to:
   - A public RPC node endpoint (find one at [chainlist.org](https://chainlist.org))
   - A block explorer URL (optional but recommended)
   - The network's chain ID
   - The native token ticker and name
   - A currency icon in SVG format

## Files to Modify

A light EVM integration touches **10-12 files** across the monorepo:

| File | Purpose | Required |
|------|---------|----------|
| `libs/ledgerjs/packages/cryptoassets/src/currencies.ts` | Currency definition | Yes |
| `libs/ledgerjs/packages/types-live/src/feature.ts` | Feature flag type | Yes |
| `libs/ledgerjs/packages/cryptoassets/src/abandonseed.ts` | Abandon seed address | Yes |
| `libs/ledger-live-common/src/families/evm/config.ts` | EVM configuration | Yes |
| `libs/ledger-live-common/src/featureFlags/defaultFeatures.ts` | Default feature flag | Yes |
| `libs/ledger-live-common/src/modularDrawer/hooks/useCurrenciesUnderFeatureFlag.ts` | UI feature flag hook | Yes |
| `libs/coin-modules/coin-evm/src/specs.ts` | Bot test min balance | Yes |
| `apps/ledger-live-desktop/src/live-common-set-supported-currencies.ts` | Desktop supported list | Yes |
| `apps/ledger-live-mobile/src/live-common-setup.ts` | Mobile supported list | Yes |
| `apps/cli/src/live-common-setup-base.ts` | CLI supported list | Yes |
| `libs/ui/packages/crypto-icons/src/svg/currency_{id}.svg` | Currency icon | Yes |
| `libs/ledger-live-common/src/__tests__/test-helpers/environment.ts` | Test environment | Yes |

## Step-by-Step Guide

### Step 1: Add Currency Definition

**File:** `libs/ledgerjs/packages/cryptoassets/src/currencies.ts`

Add a new entry to the `cryptocurrenciesById` object:

```typescript
somnia: {
  type: "CryptoCurrency",
  id: "somnia",                          // Unique currency ID (lowercase)
  coinType: CoinType.ETH,                // Always ETH for EVM chains
  name: "Somnia",                        // Display name
  managerAppName: "Ethereum",            // Always "Ethereum" for EVM
  ticker: "SOMI",                        // Native token ticker
  scheme: "somnia",                      // URL scheme (same as id)
  color: "#6F0191",                      // Brand color (hex)
  family: "evm",                         // Always "evm"
  units: ethereumUnits("SOMI", "SOMI"),  // Use helper for 18 decimals
  ethereumLikeInfo: {
    chainId: 5031,                       // Network chain ID
  },
  explorerViews: [
    {
      tx: "https://explorer.somnia.network/tx/$hash",
      address: "https://explorer.somnia.network/address/$address",
    },
  ],
},
```

**Key Points:**
- `id` must be lowercase, unique, and will be used throughout the codebase
- `coinType` is always `CoinType.ETH` for EVM chains
- `managerAppName` is always `"Ethereum"` - this maps to the Ledger device app
- `family` is always `"evm"` - this connects to the coin-evm module
- `ethereumUnits()` helper creates standard 18-decimal units with Gwei/Wei subunits

### Step 2: Add Feature Flag Type

**File:** `libs/ledgerjs/packages/types-live/src/feature.ts`

Add to the `CurrencyFeatures` type:

```typescript
export type CurrencyFeatures = {
  // ... existing entries
  currencySomnia: DefaultFeature;
};
```

**Naming Convention:** `currency` + PascalCase currency name

### Step 3: Add Abandon Seed Address

**File:** `libs/ledgerjs/packages/cryptoassets/src/abandonseed.ts`

Add the currency to `abandonSeedAddresses`:

```typescript
const abandonSeedAddresses: Partial<Record<CryptoCurrency["id"], string>> = {
  // ... existing entries
  somnia: EVM_DEAD_ADDRESS,
};
```

**Note:** Always use `EVM_DEAD_ADDRESS` for EVM chains. This is used for testing account derivation.

### Step 4: Add EVM Configuration

**File:** `libs/ledger-live-common/src/families/evm/config.ts`

Add the network configuration to `evmConfig`:

```typescript
config_currency_somnia: {
  type: "object",
  default: {
    status: {
      type: "active",
    },
    node: {
      type: "external",
      uri: "https://somnia-rpc.publicnode.com",  // Public RPC endpoint
    },
    explorer: {
      type: "none",  // or "etherscan" if etherscan-like API available
    },
    showNfts: false,
  },
},
```

**Configuration Options:**

| Field | Options | Description |
|-------|---------|-------------|
| `status.type` | `"active"` / `"inactive"` | Enable/disable the network |
| `node.type` | `"external"` / `"ledger"` | RPC provider type |
| `node.uri` | URL string | RPC endpoint |
| `explorer.type` | `"none"` / `"etherscan"` / custom | Explorer API type |
| `showNfts` | boolean | Enable NFT display |

**Explorer Types:**
- `"none"` - No explorer API integration
- `"etherscan"` - Etherscan-compatible API (Blockscout, etc.)
- Custom types may require additional adapter implementation

### Step 5: Add Default Feature Flag

**File:** `libs/ledger-live-common/src/featureFlags/defaultFeatures.ts`

```typescript
export const CURRENCY_DEFAULT_FEATURES = {
  // ... existing entries
  currencySomnia: DEFAULT_FEATURE,
};
```

### Step 6: Add Feature Flag Hook

**File:** `libs/ledger-live-common/src/modularDrawer/hooks/useCurrenciesUnderFeatureFlag.ts`

1. Add the hook:
```typescript
const somnia = useFeature("currencySomnia");
```

2. Add to the returned object:
```typescript
return {
  // ... existing entries
  somnia,
};
```

3. Add to the dependency array:
```typescript
[
  // ... existing entries
  somnia,
]
```

### Step 7: Add Bot Test Configuration

**File:** `libs/coin-modules/coin-evm/src/specs.ts`

Add minimum balance for bot testing:

```typescript
const minBalancePerCurrencyId: Partial<Record<CryptoCurrency["id"], number>> = {
  // ... existing entries
  somnia: 0.001,  // Minimum balance needed for bot tests
};
```

**Note:** Set this based on typical transaction costs. Lower values are fine for testnets or low-cost networks.

### Step 8: Add to Supported Currencies Lists

Add the currency ID to `setSupportedCurrencies()` in three files:

**Desktop:** `apps/ledger-live-desktop/src/live-common-set-supported-currencies.ts`
```typescript
setSupportedCurrencies([
  // ... existing entries
  "somnia",
]);
```

**Mobile:** `apps/ledger-live-mobile/src/live-common-setup.ts`
```typescript
setSupportedCurrencies([
  // ... existing entries
  "somnia",
]);
```

**CLI:** `apps/cli/src/live-common-setup-base.ts`
```typescript
setSupportedCurrencies([
  // ... existing entries
  "somnia",
]);
```

### Step 9: Add Currency Icon

**File:** `libs/ui/packages/crypto-icons/src/svg/currency_{id}.svg`

Add the SVG icon file:
- Filename: `currency_somnia.svg`
- Follow [Ledger icon guidelines](https://live.ledger.tools/svg-icons)
- Validate using the SVG validation tool

### Step 10: Update Test Helpers

**File:** `libs/ledger-live-common/src/__tests__/test-helpers/environment.ts`

```typescript
setSupportedCurrencies([
  // ... existing entries
  "somnia",
]);
```

### Step 11: Create Changeset

Create a changeset file in `.changeset/`:

```markdown
---
"@ledgerhq/cryptoassets": minor
"@ledgerhq/types-live": minor
"@ledgerhq/coin-evm": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
"@ledgerhq/live-cli": minor
---

Add {Network Name} coin
```

## Post-Integration Steps

### Update Snapshots

Run tests to update snapshots:

```bash
# From monorepo root
pnpm test:jest -- -u
```

This will update snapshot files like `getFormattedFeeFields.test.ts.snap`.

### Firebase Feature Flag

Configure the feature flag in Firebase Remote Config to control rollout:
- Key: `currencySomnia`
- Enable for gradual rollout

### Token Support (Optional)

If the network has ERC20 tokens:

1. Add token definitions to the [CAL](https://github.com/LedgerHQ/crypto-assets) (Crypto Assets List)
2. Tokens are automatically imported during release via the `import:cal-tokens` job

### Ethereum App Version

Ensure the Ledger Ethereum app version requirements are met in:
- `libs/coin-modules/coin-evm/src/specs.ts` (`appVersion` in `getAppQuery`)
- `libs/ledger-live-common/src/apps/support.ts` (`appVersionsRequired`)

## Checklist

Use this checklist for your PR:

- [ ] Currency definition added to `currencies.ts`
- [ ] Feature flag type added to `feature.ts`
- [ ] Abandon seed address added to `abandonseed.ts`
- [ ] EVM config added to `config.ts`
- [ ] Default feature flag added to `defaultFeatures.ts`
- [ ] Feature flag hook updated in `useCurrenciesUnderFeatureFlag.ts`
- [ ] Min balance added to `specs.ts`
- [ ] Currency added to Desktop supported list
- [ ] Currency added to Mobile supported list
- [ ] Currency added to CLI supported list
- [ ] Currency icon SVG added
- [ ] Test helper environment updated
- [ ] Changeset file created
- [ ] Snapshots updated
- [ ] Bot funded (for testing)
- [ ] Firebase feature flag configured

## Example PRs

- **Somnia:** [Commit 9659a34d99](https://github.com/LedgerHQ/ledger-live/commit/9659a34d99)
- **Monad:** Look for similar recent EVM integrations in commit history

## Troubleshooting

### Currency not appearing in app

1. Check feature flag is enabled in Firebase
2. Verify currency is in `setSupportedCurrencies()` for the platform
3. Check `status.type` is `"active"` in EVM config

### Transactions failing

1. Verify RPC endpoint is accessible and correct
2. Check chain ID matches network configuration
3. Ensure gas estimation is working (may need custom gas tracker)

### Explorer links not working

1. Verify `explorerViews` URLs use correct format
2. Check explorer supports `$hash` and `$address` placeholders

## Related Documentation

- [EVM Family Integration Process](./evm-family-integration-process/README.md) - Full integration guide including optional steps
- [Architecture](./architecture.md) - Understanding the coin-evm module structure
