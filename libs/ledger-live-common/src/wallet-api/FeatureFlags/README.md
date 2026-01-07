# Feature Flags via Wallet API

This module provides a wallet-api method (`featureFlags.get`) that allows Live Apps to fetch Firebase feature flags on-demand.

## Architecture

```
┌─────────────────┐
│   Live App      │ wallet.featureFlags.get({ featureFlagIds: [...] })
│ (Earn, Swap,    │
│  etc.)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Wallet API     │ featureFlags.get
│ (Ledger Live)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Firebase        │
│ Remote Config   │
└─────────────────┘
```

## Key Concepts

- **Manifest Allowlist**: Live Apps must declare which flags they can access via `featureFlags` array in their manifest
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

**Naming:** `featureName` → `feature_feature_name` (camelCase → snake_case)

**2. Update Live App Manifest**

Location: [Ledger manifest repository](https://github.com/LedgerHQ/manifest-api/tree/main/manifests)

```json
{
  "id": "your-app-id",
  "featureFlags": [
    "earnLidoStaking"
  ]
}
```

**3. Use in Live App**

```typescript
// Using Wallet API Client
const result = await walletApiClient.featureFlags.get({
  featureFlagIds: ['earnLidoStaking']
});

// Result: { earnLidoStaking: { enabled: true, params: { provider: "lido", apy: "3.5" } } }

if (result.earnLidoStaking?.enabled) {
  const apy = result.earnLidoStaking.params.apy;
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

The manifest's `featureFlags` array controls access:

```typescript
// ✅ Allow specific flags
{
  "featureFlags": ["stakePrograms", "earnLidoStaking"]
}
// App can ONLY fetch: stakePrograms, earnLidoStaking

// ❌ Deny all flags
{
  "featureFlags": []
}
// App CANNOT fetch any flags

// ❌ No featureFlags field
{
  // featureFlags not present
}
// App CANNOT fetch any flags
```

**Security:** Server-side validation prevents Live Apps from accessing undeclared flags.

---

## Usage

### Basic Example

```typescript
// Fetch multiple feature flags
const result = await walletApiClient.featureFlags.get({
  featureFlagIds: ['stakePrograms', 'earnLidoStaking']
});

// Access individual flags
const stakePrograms = result.stakePrograms;
const lidoStaking = result.earnLidoStaking;

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
    queryFn: () => walletApiClient.featureFlags.get({ featureFlagIds }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage
const { data, isLoading } = useFeatureFlags(['stakePrograms']);
```

### Handling Non-Existent Flags

Flags that don't exist or aren't allowed return `null`:

```typescript
const result = await walletApiClient.featureFlags.get({
  featureFlagIds: ['nonExistentFlag']
});

result.nonExistentFlag === null; // true
```

---

## API Reference

### Server-Side: `getFeatureFlagsForLiveApp()`

```typescript
function getFeatureFlagsForLiveApp({
  requestedFeatureFlagIds: string[];
  manifest: LiveAppManifest;
  appLanguage?: string;
}): Record<string, Feature<unknown> | null>
```

**Behavior:**
- Filters requests based on `manifest.featureFlags` allowlist
- Returns `null` for non-existent or unauthorized flags
- Applies version/language filtering from feature params

### Client-Side: `walletApiClient.featureFlags.get()`

```typescript
interface FeatureFlagsGetParams {
  featureFlagIds: string[];
}

await walletApiClient.featureFlags.get(
  params: FeatureFlagsGetParams
): Promise<Record<string, Feature<unknown> | null>>
```

**Returns:** Map of feature flag IDs to feature values (or `null` if not found/unauthorized)

---

## Testing

```bash
# Run FeatureFlags tests (from repository root)
pnpm --filter @ledgerhq/live-common jest wallet-api/FeatureFlags

# Type check (from repository root)
pnpm turbo typecheck
```

**Live App Integration:**
- Implement Wallet API client in your Live App
- Create optional React hooks as needed for your framework
