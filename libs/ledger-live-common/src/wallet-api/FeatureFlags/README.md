# Feature Flags via Wallet API

This module provides a wallet-api method (`custom.featureFlags.get`) that allows Live Apps to fetch feature flags on-demand.

## Architecture

```
┌─────────────────┐
│   Live App      │ featureFlagModule.get(["flagId1", "flagId2"])
│ (Earn, Swap,    │
│  etc.)          │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  @ledgerhq/wallet-api-feature-flag-module (Client-Side Module)  │
│  libs/feature-flag-module                                       │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Wallet API     │ custom.featureFlags.get
│ (Ledger Live)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Firebase        │
│ Remote Config   │
└─────────────────┘
```

## Client-Side Module

Live Apps should use the `@ledgerhq/wallet-api-feature-flag-module` package to interact with feature flags:

```bash
pnpm install @ledgerhq/wallet-api-feature-flag-module @ledgerhq/wallet-api-client
```

```typescript
import { FeatureFlagModule } from "@ledgerhq/wallet-api-feature-flag-module";
import { WalletAPIClient, WindowMessageTransport } from "@ledgerhq/wallet-api-client";

// Setup transport and client (typically done once in your app)
const transport = new WindowMessageTransport();
transport.connect();
const walletApiClient = new WalletAPIClient(transport);
const featureFlagModule = new FeatureFlagModule(walletApiClient);

// Fetch feature flags
const features = await featureFlagModule.get(["stakePrograms", "earnLidoStaking"]);

if (features.stakePrograms?.enabled) {
  // Feature is enabled
}
```

## Key Concepts

- **Manifest Allowlist**: Live Apps must declare which flags they can access via `featureFlags` field in their manifest
  - Use `"*"` (wildcard) to allow access to all feature flags
  - Use an array `["flag1", "flag2"]` to allow specific flags only
- **Server-Side Validation**: Ledger Live validates all requests against the manifest allowlist
- **Two Types of Flags**:
  - **Dynamic Flags**: Firebase-only, no Ledger Live release needed
  - **Typed Flags**: Defined in code with TypeScript types and defaults

---

## Adding Feature Flags

### Option 1: Dynamic Flags (No Ledger Live Release)

Use when the flag is only for Live Apps and you need quick deployment.

**1. Add to Firebase Remote Config**

```json
{
  "feature_earn_lido_staking": {
    "enabled": true,
    "params": {
      "provider": "lido",
      "apy": "3.5"
    }
  }
}
```

**Naming:** `featureName` (camelCase) → `feature_feature_name` (snake_case with `feature_` prefix), e.g. `earnLidoStaking` → `feature_earn_lido_staking`

**2. Update Live App Manifest**

Location: [Ledger manifest repository](https://github.com/LedgerHQ/manifest-api/tree/main/manifests)

```json
{
  "id": "your-app-id",
  "featureFlags": ["earnLidoStaking"]
}
```

Or use wildcard to allow all flags:

```json
{
  "id": "your-app-id",
  "featureFlags": "*"
}
```

**3. Use in Live App**

```typescript
import { FeatureFlagModule } from "@ledgerhq/wallet-api-feature-flag-module";
import { WalletAPIClient, WindowMessageTransport } from "@ledgerhq/wallet-api-client";

// Setup transport and client (typically done once in your app)
const transport = new WindowMessageTransport();
transport.connect();
const walletApiClient = new WalletAPIClient(transport);
const featureFlagModule = new FeatureFlagModule(walletApiClient);

// Fetch feature flags
const features = await featureFlagModule.get(["earnLidoStaking"]);

// Result: { earnLidoStaking: { enabled: true, params: { provider: "lido", apy: "3.5" } } }

if (features.earnLidoStaking?.enabled) {
  const apy = features.earnLidoStaking.params?.apy;
  // Use the feature
}
```

---

### Option 2: Typed Flags (Requires Ledger Live Release)

Use when the flag is used in Ledger Live code or you need type safety.

**1. Add to Default Features**

File: `libs/ledger-live-common/src/featureFlags/defaultFeatures.ts`

```typescript
export const DEFAULT_FEATURES: Features = {
  earnLidoStaking: {
    enabled: false,
    params: {
      provider: "kiln",
      apy: "3.0"
    }
  }
};
```

**2. Add Type Definition**

File: `libs/ledgerjs/packages/types-live/src/feature.ts`

```typescript
export type FeatureId =
  | "stakePrograms"
  | "earnLidoStaking";

export type Feature_EarnLidoStaking = Feature<{
  provider: string;
  apy: string;
}>;
```

**3. Release Ledger Live** → **4. Update Manifest** → **5. Optionally Configure Firebase**

**Timeline:** 2-4 weeks 📅

**Benefits:** Type safety, defaults if Firebase is down, appears in developer settings

---

## Permission Model

The manifest's `featureFlags` field controls access:

**Allow ALL feature flags (wildcard):**
```json
{
  "featureFlags": "*"
}
```
App can fetch ANY feature flag.

**Allow specific flags only:**
```json
{
  "featureFlags": ["stakePrograms", "earnLidoStaking"]
}
```
App can ONLY fetch the listed flags.

**Deny all flags (empty array):**
```json
{
  "featureFlags": []
}
```
App CANNOT fetch any flags.

**Deny all flags (field not present):**
```json
{
  "id": "your-app-id"
}
```
App CANNOT fetch any flags (featureFlags field is missing).

**Security:** Server-side validation prevents Live Apps from accessing undeclared flags.

---

## Usage

### Basic Example

```typescript
import { FeatureFlagModule } from "@ledgerhq/wallet-api-feature-flag-module";
import { WalletAPIClient, WindowMessageTransport } from "@ledgerhq/wallet-api-client";

// Setup (typically done once in your app initialization)
const transport = new WindowMessageTransport();
transport.connect();
const walletApiClient = new WalletAPIClient(transport);
const featureFlagModule = new FeatureFlagModule(walletApiClient);

// Fetch multiple feature flags
const features = await featureFlagModule.get(["stakePrograms", "earnLidoStaking"]);

// Access individual flags
const stakePrograms = features.stakePrograms;
const lidoStaking = features.earnLidoStaking;

if (stakePrograms?.enabled) {
  // Use stakePrograms feature
}
```

### React Hook Example (Optional)

You can create a wrapper hook in your Live App:

```typescript
function useFeatureFlags(featureFlagIds: string[]) {
  return useQuery({
    queryKey: ['featureFlags', featureFlagIds],
    queryFn: () => featureFlagModule.get(featureFlagIds),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage
const { data, isLoading } = useFeatureFlags(['stakePrograms']);
```

### Handling Non-Existent Flags

Flags that don't exist or aren't allowed return `null`:

```typescript
const features = await featureFlagModule.get(["nonExistentFlag"]);

features.nonExistentFlag === null; // true
```

---

## API Reference

### Client-Side: `FeatureFlagModule`

Package: `@ledgerhq/wallet-api-feature-flag-module`

```typescript
import { FeatureFlagModule, Feature } from "@ledgerhq/wallet-api-feature-flag-module";

class FeatureFlagModule extends CustomModule {
  /**
   * Fetch feature flags from Ledger Live.
   * @param featureFlagIds - Array of feature flag IDs to fetch
   * @returns A record mapping feature flag IDs to their values, or null if not found/unauthorized
   */
  async get(featureFlagIds: string[]): Promise<Record<string, Feature<unknown> | null>>;
}

type Feature<T = unknown> = {
  enabled: boolean;
  params?: T;
};
```

### Server-Side: `getFeatureFlagsForLiveApp()`

Location: `libs/ledger-live-common/src/wallet-api/FeatureFlags/resolver.ts`

```typescript
function getFeatureFlagsForLiveApp({
  requestedFeatureFlagIds: string[];
  manifest: LiveAppManifest;
  getFeature: GetFeatureFn;
}): Record<string, Feature<unknown> | null>
```

**Behavior:**
- Filters requests based on `manifest.featureFlags` allowlist
- Returns `null` for non-existent or unauthorized flags

---

## Testing

```bash
# Run FeatureFlags tests (from repository root)
pnpm --filter @ledgerhq/live-common jest wallet-api/FeatureFlags

# Build the client module
pnpm --filter @ledgerhq/wallet-api-feature-flag-module build

# Type check (from repository root)
pnpm turbo typecheck
```

**Live App Integration:**
- Install `@ledgerhq/wallet-api-feature-flag-module` in your Live App
- Initialize the `FeatureFlagModule` with your `WalletAPIClient`
- Create optional React hooks as needed for your framework
