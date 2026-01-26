# Ledger Live Desktop - Architecture

> **Part:** ledger-live-desktop | **Type:** Desktop (Electron) | **Version:** 2.137.0

## Overview

Ledger Live Desktop is an Electron-based desktop application providing a secure interface for managing crypto assets via Ledger hardware wallets.

## Technology Stack

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| Runtime | Electron | 39.2.7 | Main + Renderer processes |
| UI Framework | React | 18.3.1 | Functional components |
| State | Redux Toolkit | catalog | Centralized state |
| Styling | styled-components | 5.3.11 | + Tailwind 4.x |
| Bundler | Rspack | 1.7.x | Rust-based bundler |
| Router | react-router | 7.12.0 | SPA routing |
| Testing | Jest + Playwright | catalog | Unit + E2E |

## Architecture Pattern

The application follows a **Component-Based Architecture** with an ongoing migration to **MVVM**:

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   Logger    │ │   Updater   │ │  Transport Handler  ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
                           ↕ IPC
┌─────────────────────────────────────────────────────────┐
│                   Electron Renderer Process              │
│  ┌─────────────────────────────────────────────────────┐│
│  │                    React Application                 ││
│  │  ┌─────────┐ ┌──────────┐ ┌────────────────────────┐││
│  │  │ Screens │ │Components│ │        MVVM            │││
│  │  │ (313)   │ │  (437)   │ │ features/ components/  │││
│  │  └─────────┘ └──────────┘ └────────────────────────┘││
│  │                      ↓                               ││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │              Redux Store                         │││
│  │  │  reducers/ actions/ middlewares/                 │││
│  │  └─────────────────────────────────────────────────┘││
│  │                      ↓                               ││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │           @ledgerhq/live-common                  │││
│  │  │   bridges/ families/ hw/ exchange/               │││
│  │  └─────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/ledger-live-desktop/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Entry point
│   │   ├── db/                  # Local database (encrypted)
│   │   ├── updater/             # Auto-update logic
│   │   └── transportHandler.ts  # Hardware communication
│   ├── renderer/                # React application
│   │   ├── screens/             # Route-based screens (313 files)
│   │   ├── components/          # Reusable UI (437 files)
│   │   ├── families/            # Coin-specific UI (25 families)
│   │   ├── reducers/            # Redux state slices
│   │   ├── actions/             # Redux action creators
│   │   ├── hooks/               # Custom React hooks (71 files)
│   │   ├── modals/              # Modal dialogs (145 files)
│   │   └── styles/              # Global styles
│   ├── mvvm/                    # New MVVM architecture
│   │   ├── features/            # Feature modules (522 files)
│   │   ├── components/          # MVVM components
│   │   ├── hooks/               # MVVM hooks
│   │   └── utils/               # Utilities
│   ├── config/                  # Application configuration
│   ├── sentry/                  # Error tracking
│   └── preloader/               # Window preloader
├── static/                      # Static assets
├── tools/                       # Build tooling
└── tests/                       # Test suites
```

## State Management

### Redux Store Structure

```typescript
{
  accounts: AccountState,           // User accounts
  application: ApplicationState,    // App metadata
  countervalues: CountervaluesState,// Fiat conversions
  devices: DevicesState,            // Connected devices
  dynamicContent: DynamicContentState, // Remote content
  market: MarketState,              // Market data
  modals: ModalsState,              // Modal visibility
  onboarding: OnboardingState,      // Onboarding flow
  portfolio: PortfolioState,        // Portfolio data
  settings: SettingsState,          // User preferences
  trustchain: TrustchainState,      // Multi-device sync
  UI: UIState,                      // UI state
  wallet: WalletState,              // Wallet data
  walletSync: WalletSyncState,      // Sync status
}
```

### Data Fetching

RTK Query is used via the `dada-client`:

```typescript
// Redux store configuration
import { assetsDataApi } from '@ledgerhq/live-common/dada-client/state-manager/api';

const store = configureStore({
  reducer: {
    [assetsDataApi.reducerPath]: assetsDataApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(assetsDataApi.middleware),
});
```

## Families Architecture

Each blockchain has dedicated UI components in `renderer/families/`:

```
families/
├── bitcoin/
│   ├── AccountBalanceSummaryFooter.tsx
│   ├── AccountHeaderManageActions.ts
│   ├── CoinControlModal.tsx
│   ├── FeesField.tsx
│   └── SendAmountFields.tsx
├── cosmos/
│   ├── DelegationFlowModal/
│   ├── RedelegationFlowModal/
│   └── UndelegationFlowModal/
├── evm/
│   ├── AccountHeaderManageActions.ts
│   ├── SendAmountFields.tsx
│   └── TransactionConfirmFields.tsx
└── ... (25+ families)
```

## MVVM Migration

New features follow the MVVM pattern in `src/mvvm/`:

```
mvvm/
├── features/
│   └── FeatureName/
│       ├── __integrations__/   # Integration tests
│       ├── components/         # Feature components
│       ├── screens/            # Feature screens
│       ├── hooks/              # Feature hooks
│       └── utils/              # Feature utilities
├── components/                  # Shared MVVM components
├── hooks/                       # Shared hooks
└── utils/                       # Shared utilities
```

### MVVM Component Structure

```typescript
// Container (index.tsx)
export const FeatureContainer = () => {
  const viewModel = useFeatureViewModel();
  return <FeatureView {...viewModel} />;
};

// ViewModel (useFeatureViewModel.ts)
export const useFeatureViewModel = () => {
  const data = useSelector(selectFeatureData);
  const dispatch = useDispatch();
  
  return {
    data,
    onAction: () => dispatch(featureAction()),
  };
};

// View (FeatureView.tsx)
export const FeatureView = ({ data, onAction }: ViewProps) => {
  return <Button onClick={onAction}>{data.label}</Button>;
};
```

## Testing Strategy

| Type | Tool | Location |
|------|------|----------|
| Unit Tests | Jest | `*.test.ts(x)` alongside source |
| Component Tests | Testing Library | `__tests__/` folders |
| E2E Tests | Playwright | `tests/specs/` |
| Integration Tests | Jest + MSW | `__integrations__/` (MVVM) |

### Running Tests

```bash
# Unit tests with coverage
pnpm desktop test:jest:coverage

# Playwright E2E tests
pnpm desktop test:playwright

# Specific test file
pnpm desktop test:jest "filename"
```

## Build & Development

### Development

```bash
# Start development server
pnpm dev:lld

# With MSW mocking
pnpm dev:lld:msw

# With DevTools
pnpm dev:lld:debug
```

### Production Build

```bash
# Build JavaScript bundle
pnpm desktop build:js

# Build distributable
pnpm desktop release
```

## Security Considerations

- **Electron Fuses**: Security hardening via `@electron/fuses`
- **CSP**: Content Security Policy enforcement
- **Signed Updates**: Cryptographically signed auto-updates
- **Encrypted Storage**: Local database encryption via `electron-store`
- **IPC Isolation**: Strict main/renderer process separation
