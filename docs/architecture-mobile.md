# Ledger Live Mobile - Architecture

> **Part:** ledger-live-mobile | **Type:** Mobile (React Native) | **Version:** 3.102.0

## Overview

Ledger Live Mobile is a React Native application providing secure crypto asset management for iOS and Android devices via Ledger hardware wallets.

## Technology Stack

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| Framework | React Native | 0.79.7 | New Architecture enabled |
| UI | React | 19.0.0 | Concurrent features |
| State | Redux Toolkit + Jotai | catalog | Hybrid state |
| Navigation | React Navigation | 7.x | Native stack |
| Styling | styled-components | 6.1.19 | + native-ui |
| Testing | Jest + Detox | catalog | Unit + E2E |
| Analytics | Segment, Datadog | - | Tracking |

## Architecture Pattern

The application follows a **Component-Based Architecture** with ongoing **MVVM migration**:

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │                 Navigation Stack                     ││
│  │      @react-navigation/native-stack                  ││
│  └─────────────────────────────────────────────────────┘│
│                          ↓                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │                    Screens                           ││
│  │  Portfolio | Accounts | Discover | Settings | ...    ││
│  └─────────────────────────────────────────────────────┘│
│                          ↓                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │                   Components                         ││
│  │     431+ reusable components + families              ││
│  └─────────────────────────────────────────────────────┘│
│                          ↓                               │
│  ┌───────────────────┐  ┌──────────────────────────────┐│
│  │   Redux Store     │  │     @ledgerhq/live-common    ││
│  │   (18 reducers)   │  │   bridges/families/hw/       ││
│  └───────────────────┘  └──────────────────────────────┘│
│                          ↓                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Hardware Transport                      ││
│  │         BLE | USB-HID | Speculos                     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/ledger-live-mobile/
├── src/
│   ├── screens/                 # Route screens (50+ screens)
│   │   ├── Portfolio/           # Main portfolio view
│   │   ├── Account/             # Account details
│   │   ├── SendFunds/           # Send flow
│   │   ├── ReceiveFunds/        # Receive flow
│   │   ├── Settings/            # App settings (115 files)
│   │   └── Onboarding/          # Onboarding flow (101 files)
│   ├── components/              # Shared components (431 files)
│   ├── families/                # Coin-specific UI (583 files)
│   ├── reducers/                # Redux reducers (18 slices)
│   ├── actions/                 # Redux actions
│   ├── hooks/                   # Custom hooks (24 files)
│   ├── navigation/              # Navigation configuration
│   ├── context/                 # React contexts (14 files)
│   ├── logic/                   # Business logic (29 files)
│   ├── mvvm/                    # MVVM architecture (620 files)
│   │   ├── features/            # Feature modules
│   │   ├── components/          # MVVM components
│   │   └── hooks/               # MVVM hooks
│   ├── locales/                 # i18n translations (12 locales)
│   ├── animations/              # Lottie animations
│   └── icons/                   # Custom icons (85 files)
├── ios/                         # iOS native code
├── android/                     # Android native code
├── e2e/                         # Detox E2E tests
└── fastlane/                    # Build automation
```

## State Management

### Redux Store

```typescript
{
  accounts: AccountsState,
  appstate: AppState,
  auth: AuthState,                 // Biometrics, PIN
  ble: BLEState,                   // Bluetooth state
  countervalues: CountervaluesState,
  dynamicContent: DynamicContentState,
  earn: EarnState,                 // Staking/earn
  inView: InViewState,             // Visibility tracking
  market: MarketState,
  notifications: NotificationsState,
  protect: ProtectState,           // Ledger Recover
  ratings: RatingsState,           // App ratings
  settings: SettingsState,
  toast: ToastState,
  trustchain: TrustchainState,
  wallet: WalletState,
  walletconnect: WalletConnectState,
  walletSync: WalletSyncState,
}
```

### Jotai Atoms

Used for local component state and scoped state:

```typescript
import { atom, useAtom } from 'jotai';
import { atomScope } from 'jotai-scope';

const searchAtom = atom('');
const [search, setSearch] = useAtom(searchAtom);
```

## Navigation Structure

```typescript
// Main navigation stack
const RootNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Main" component={MainNavigator} />
    <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
    <Stack.Screen name="SendFunds" component={SendFundsNavigator} />
    <Stack.Screen name="ReceiveFunds" component={ReceiveFundsNavigator} />
  </Stack.Navigator>
);

// Tab navigator
const MainNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Portfolio" component={PortfolioScreen} />
    <Tab.Screen name="Assets" component={AssetsScreen} />
    <Tab.Screen name="Discover" component={DiscoverScreen} />
    <Tab.Screen name="MyLedger" component={MyLedgerScreen} />
  </Tab.Navigator>
);
```

## Families Architecture

Coin-specific UI is organized in `src/families/`:

```
families/
├── bitcoin/
│   ├── AccountActions.tsx
│   ├── SendRowsFee.tsx
│   └── operationDetails/
├── cosmos/
│   ├── Delegations/
│   ├── RedelegationFlow/
│   └── UndelegationFlow/
├── evm/
│   ├── EditFeeUnitEvm.tsx
│   ├── SendRowsFee.tsx
│   └── StakingDrawer/
└── ... (583 files across 25+ families)
```

## MVVM Migration

New features follow the MVVM pattern in `src/mvvm/`:

```
mvvm/
├── features/
│   └── FeatureName/
│       ├── __integrations__/   # Integration tests (MSW)
│       ├── components/         # Feature components
│       ├── screens/            # Feature screens
│       │   └── ScreenName/
│       │       ├── index.tsx                    # Container
│       │       ├── useScreenNameViewModel.ts   # ViewModel
│       │       └── types.ts
│       ├── hooks/              # Feature hooks
│       └── utils/              # Utilities
├── components/                  # Shared components
├── hooks/                       # Shared hooks
└── utils/                       # Shared utilities
```

## Testing Strategy

| Type | Tool | Location |
|------|------|----------|
| Unit Tests | Jest | `*.test.ts(x)` alongside source |
| Component Tests | RNTL | `@tests/test-renderer` |
| E2E Tests | Detox | `e2e/` folder |
| Integration Tests | Jest + MSW | `__integrations__/` |

### Custom Test Renderer

```typescript
import { render } from '@tests/test-renderer';

describe('Feature', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Feature />);
    expect(getByText('Expected')).toBeTruthy();
  });
});
```

### Running Tests

```bash
# Jest unit tests
pnpm mobile test:jest

# With coverage
pnpm mobile test:jest:coverage

# Detox E2E (iOS)
pnpm mobile e2e:test
```

## Build & Development

### Development

```bash
# Start Metro bundler
pnpm dev:llm

# With MSW mocking
pnpm dev:llm:msw

# iOS simulator
pnpm mobile ios

# Android emulator
pnpm mobile android
```

### Production Builds

```bash
# iOS Ad-Hoc
pnpm mobile ios:ci:adhoc

# Android APK
pnpm mobile android:apk

# iOS TestFlight
pnpm mobile ios:ci:testflight

# Android Play Store
pnpm mobile android:ci:playstore
```

## Platform-Specific Code

### Native Modules

```
src/native-modules/
└── LocationHelperModule.ts
```

### Platform Checks

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific logic
} else {
  // Android-specific logic
}
```

## Security Considerations

- **Biometric Auth**: TouchID/FaceID/Fingerprint via `react-native-biometrics`
- **Secure Storage**: Keychain/Keystore via `react-native-keychain`
- **BLE Security**: Encrypted Bluetooth communication
- **Deep Link Validation**: Signed deep link verification
- **Certificate Pinning**: API certificate validation
