# Can StableStepProps & DynamicStepProps Be Shared Between Mobile and Desktop?

## Current State Comparison

### DynamicStepProps - ✅ IDENTICAL

**Mobile:**

```typescript
export type DynamicStepProps = {
  isProcessing: boolean;
  onboardingStatus: AccountOnboardStatus;
  onboardingResult: OnboardingResult | undefined;
  error: Error | null;
};
```

**Desktop:**

```typescript
export type DynamicStepProps = {
  isProcessing: boolean;
  onboardingStatus: AccountOnboardStatus;
  onboardingResult: OnboardingResult | undefined;
  error: Error | null;
};
```

**Verdict:** Already identical - can be shared immediately ✅

---

### StableStepProps - ⚠️ DIFFERENCES EXIST

**Mobile:**

```typescript
export type StableStepProps = {
  currency: CryptoCurrency;
  device: { deviceId: string }; // ⚠️ Only deviceId
  accountName: string;
  editedNames: { [accountId: string]: string };
  creatableAccount: Account;
  importableAccounts: Account[];
  isReonboarding?: boolean;
  onboardingConfig?: OnboardingConfig;
  onAddAccounts: (accounts: Account[]) => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
  transitionTo: (stepId: StepId) => void;
  // ❌ No t: TFunction
};
```

**Desktop:**

```typescript
export type StableStepProps = {
  t: TFunction; // ⚠️ Translation function
  device: Device; // ⚠️ Full Device object
  currency: CryptoCurrency;
  accountName: string;
  editedNames: { [accountId: string]: string };
  creatableAccount: Account;
  importableAccounts: Account[];
  isReonboarding?: boolean;
  onboardingConfig?: OnboardingConfig;
  onAddAccounts: (accounts: Account[]) => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
  transitionTo: (stepId: StepId) => void;
};
```

**Key Differences:**

1. **Device type**: `Device` (full object) vs `{ deviceId: string }`
2. **Translation**: `t: TFunction` vs none (uses `<Trans>` component)

---

## Argument FOR Sharing (Unification)

### ✅ Benefits

1. **Single Source of Truth**

   - One type definition to maintain
   - Changes propagate automatically to both platforms
   - Reduces drift between implementations

2. **Type Safety Across Platforms**

   - Ensures API contracts match
   - Prevents platform-specific bugs
   - Easier refactoring

3. **Code Reuse**

   - Shared type definitions in `ledger-live-common`
   - Consistent prop interfaces
   - Easier to share step components (if desired)

4. **Maintenance**

   - Fix types once, benefits both platforms
   - Easier onboarding for new developers
   - Clearer architecture

5. **DynamicStepProps Already Works**
   - Proves sharing is feasible
   - No platform-specific logic needed

### 🔧 Implementation Strategy (If Sharing)

**Option 1: Union Types (Platform-Specific)**

```typescript
// In ledger-live-common
export type BaseStableStepProps = {
  currency: CryptoCurrency;
  accountName: string;
  editedNames: { [accountId: string]: string };
  creatableAccount: Account;
  importableAccounts: Account[];
  isReonboarding?: boolean;
  onboardingConfig?: OnboardingConfig;
  onAddAccounts: (accounts: Account[]) => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
  transitionTo: (stepId: StepId) => void;
};

// Platform-specific extensions
export type MobileStableStepProps = BaseStableStepProps & {
  device: { deviceId: string };
};

export type DesktopStableStepProps = BaseStableStepProps & {
  device: Device;
  t: TFunction;
};
```

**Option 2: Normalize to Common Interface**

```typescript
// Normalize device to just deviceId
export type StableStepProps = {
  currency: CryptoCurrency;
  deviceId: string; // Normalized - both platforms can provide
  accountName: string;
  // ... rest
  // Remove t - use i18n hooks/components instead
};
```

**Option 3: Make Optional/Platform Agnostic**

```typescript
export type StableStepProps = {
  currency: CryptoCurrency;
  device?: Device | { deviceId: string }; // Accept both
  deviceId: string; // Required fallback
  t?: TFunction; // Optional - use Trans component if missing
  // ... rest
};
```

---

## Argument AGAINST Sharing (Platform Separation)

### ⚠️ Challenges

1. **Device Type Mismatch**

   - Desktop needs full `Device` object (modelId, deviceName, wired)
   - Mobile only needs `deviceId`
   - Desktop components use `device.modelId`, `device.deviceName`
   - Normalizing loses type safety

2. **Translation Pattern Difference**

   - Desktop: Uses `t()` function calls (`t("key")`)
   - Mobile: Uses `<Trans>` component (`<Trans i18nKey="key" />`)
   - Different i18n patterns are platform conventions
   - Forcing one pattern breaks platform idioms

3. **Platform-Specific Needs**

   - Desktop may need more device info for UI
   - Mobile may have different navigation patterns
   - Each platform optimizes for its constraints

4. **Type Complexity**

   - Union types become complex
   - Conditional types needed
   - May reduce type inference quality

5. **Breaking Changes**

   - Changing shared types affects both platforms
   - Risk of breaking one platform when fixing another
   - Requires careful coordination

6. **Abstraction Overhead**
   - May need adapters/wrappers
   - Additional indirection
   - Harder to understand platform-specific code

### 📊 Real-World Usage Analysis

**Desktop uses Device for:**

- `device.modelId` - Device model identification
- `device.deviceName` - Display name
- `device.wired` - Connection type
- Full device object passed to transaction confirm components

**Mobile uses deviceId for:**

- Only needs `deviceId` for bridge calls
- Device info comes from Redux selectors
- Simpler, lighter interface

**Translation:**

- Desktop: Direct function calls (`t("key", params)`)
- Mobile: Component-based (`<Trans i18nKey="key" />`)
- Different patterns serve different needs

---

## Recommendation

### ✅ DynamicStepProps: SHARE IMMEDIATELY

- Already identical
- No platform-specific logic
- Pure data types
- Low risk, high benefit

### ⚠️ StableStepProps: CONDITIONAL SHARING

**Option A: Keep Separate (Recommended)**

- **Pros:** Platform-specific optimizations, clearer code, no abstraction overhead
- **Cons:** Some duplication, need to keep in sync manually
- **Best for:** When platforms have genuinely different needs

**Option B: Share with Platform Extensions**

```typescript
// Shared base
export type BaseStableStepProps = {
  /* common fields */
};

// Platform extensions
export type MobileStableStepProps = BaseStableStepProps & {
  device: { deviceId: string };
};

export type DesktopStableStepProps = BaseStableStepProps & {
  device: Device;
  t: TFunction;
};
```

- **Pros:** Shared common fields, platform-specific extensions
- **Cons:** More complex types, conditional logic needed
- **Best for:** When most fields are shared

**Option C: Normalize to Common Interface**

- Normalize device to `deviceId: string`
- Remove `t` function, use i18n hooks/components
- **Pros:** True unification
- **Cons:** Requires refactoring both platforms, may lose type safety
- **Best for:** Long-term if platforms converge

---

## Conclusion

**DynamicStepProps:** ✅ **SHARE NOW** - No blockers, immediate benefit

**StableStepProps:** ⚠️ **CONDITIONAL** - Depends on:

1. How much device info desktop actually needs
2. Willingness to refactor translation patterns
3. Long-term platform convergence goals

**Current Recommendation:**

- Share `DynamicStepProps` immediately
- Keep `StableStepProps` separate for now, but document the differences
- Consider sharing base props with platform extensions if patterns converge
