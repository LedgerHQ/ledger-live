# Ledger Live - Source Tree Analysis

> **Generated:** 2026-01-23 | **Scan Level:** Exhaustive

## Repository Root Structure

```
ledger-live/                          # Monorepo root
├── .changeset/                       # Changeset version management
├── .cursor/                          # Cursor IDE configuration
├── .github/                          # GitHub workflows & templates
│   └── workflows/                    # 73 CI/CD workflow files
├── _bmad/                            # BMAD workflow system
├── apps/                             # 🎯 User-facing applications
│   ├── ledger-live-desktop/          # Electron desktop app
│   ├── ledger-live-mobile/           # React Native mobile app
│   ├── cli/                          # Command-line interface
│   └── web-tools/                    # Developer web tools
├── docs/                             # 📚 Generated documentation
├── e2e/                              # End-to-end test suites
│   ├── desktop/                      # Desktop E2E (Playwright)
│   └── mobile/                       # Mobile E2E (Detox)
├── features/                         # Shared feature modules
│   └── market-banner/                # Market banner feature
├── libs/                             # 📦 Shared libraries
│   ├── ledger-live-common/           # Core business logic
│   ├── ledgerjs/                     # Hardware wallet SDK
│   ├── coin-modules/                 # Blockchain integrations
│   ├── coin-framework/               # Coin abstraction layer
│   ├── ui/                           # Design system
│   ├── ledger-services/              # Backend service clients
│   └── [40+ additional libs]         # Specialized modules
├── patches/                          # pnpm patches
├── tests/                            # Test utilities & fixtures
│   ├── dummy-live-app/               # Test live app
│   ├── dummy-wallet-app/             # Test wallet app
│   └── dummy-ptx-app/                # Test PTX app
├── tools/                            # Build & CI tooling
│   ├── actions/                      # GitHub Actions
│   ├── github-bot/                   # PR automation bot
│   └── [scripts & utilities]
├── package.json                      # Root package manifest
├── pnpm-workspace.yaml               # Workspace configuration
├── turbo.json                        # Turborepo configuration
└── README.md                         # Project documentation
```

## Applications Deep Dive

### ledger-live-desktop (apps/ledger-live-desktop/)

```
ledger-live-desktop/
├── src/
│   ├── main/                         # 🔧 Electron Main Process
│   │   ├── index.ts                  # Entry point
│   │   ├── db/                       # Encrypted local database
│   │   │   ├── crypto.ts             # Encryption utilities
│   │   │   └── index.ts              # Database interface
│   │   ├── updater/                  # Auto-update system
│   │   │   ├── createAppUpdater.ts   # Update logic
│   │   │   └── ledger-pubkey.ts      # Signature verification
│   │   ├── logger.ts                 # Main process logging
│   │   ├── menu.ts                   # Application menu
│   │   └── transportHandler.ts       # Hardware communication
│   │
│   ├── renderer/                     # 🖥️ React Application
│   │   ├── screens/                  # Route-based screens (313 files)
│   │   │   ├── account/              # Account views
│   │   │   ├── accounts/             # Accounts list
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   ├── exchange/             # Swap/buy/sell
│   │   │   ├── manager/              # Device manager
│   │   │   ├── market/               # Market data
│   │   │   ├── settings/             # App settings
│   │   │   └── onboarding/           # Onboarding flow
│   │   │
│   │   ├── components/               # Reusable components (437 files)
│   │   │   ├── AccountsPage/         # Accounts UI
│   │   │   ├── Chart/                # Chart components
│   │   │   ├── DeviceAction/         # Device interaction
│   │   │   ├── Modals/               # Modal components
│   │   │   └── [200+ more]
│   │   │
│   │   ├── families/                 # 🔗 Coin-specific UI (25 families)
│   │   │   ├── bitcoin/              # Bitcoin UI
│   │   │   ├── cosmos/               # Cosmos staking UI
│   │   │   ├── evm/                  # EVM chains UI
│   │   │   ├── polkadot/             # Polkadot staking UI
│   │   │   ├── solana/               # Solana UI
│   │   │   └── [20+ more]
│   │   │
│   │   ├── reducers/                 # Redux state slices (19 files)
│   │   ├── actions/                  # Redux actions (18 files)
│   │   ├── hooks/                    # Custom hooks (71 files)
│   │   ├── modals/                   # Modal dialogs (145 files)
│   │   └── middlewares/              # Redux middlewares
│   │
│   ├── mvvm/                         # 🆕 MVVM Architecture (522 files)
│   │   ├── features/                 # Feature modules
│   │   │   ├── Earn/                 # Staking/earn feature
│   │   │   ├── Exchange/             # Swap feature
│   │   │   ├── NFT/                  # NFT feature
│   │   │   └── [many more]
│   │   ├── components/               # Shared MVVM components
│   │   ├── hooks/                    # Shared hooks
│   │   └── utils/                    # Utilities
│   │
│   ├── config/                       # App configuration
│   ├── sentry/                       # Error tracking
│   └── preloader/                    # Window preloader
│
├── static/                           # Static assets
├── tools/                            # Build scripts
│   ├── rspack/                       # Rspack configuration
│   └── dist/                         # Distribution scripts
├── tests/                            # Test suites
└── package.json
```

### ledger-live-mobile (apps/ledger-live-mobile/)

```
ledger-live-mobile/
├── src/
│   ├── screens/                      # 📱 App Screens (50+ screens)
│   │   ├── Portfolio/                # Main portfolio (23 files)
│   │   ├── Account/                  # Account details (13 files)
│   │   ├── Accounts/                 # Accounts list (9 files)
│   │   ├── SendFunds/                # Send flow (22 files)
│   │   ├── ReceiveFunds/             # Receive flow (15 files)
│   │   ├── Settings/                 # App settings (115 files)
│   │   ├── Onboarding/               # Onboarding (101 files)
│   │   ├── MyLedgerDevice/           # Device manager (35 files)
│   │   ├── Swap/                     # Swap feature (27 files)
│   │   └── [40+ more screens]
│   │
│   ├── components/                   # Shared components (431 files)
│   │   ├── AccountCard/
│   │   ├── BottomSheet/
│   │   ├── CurrencyRow/
│   │   ├── DeviceAction/
│   │   └── [400+ more]
│   │
│   ├── families/                     # 🔗 Coin-specific UI (583 files)
│   │   ├── bitcoin/
│   │   ├── cosmos/
│   │   ├── evm/
│   │   ├── polkadot/
│   │   ├── solana/
│   │   └── [20+ more]
│   │
│   ├── reducers/                     # Redux reducers (18 slices)
│   ├── actions/                      # Redux actions (20 files)
│   ├── hooks/                        # Custom hooks (24 files)
│   ├── context/                      # React contexts (14 files)
│   ├── logic/                        # Business logic (29 files)
│   ├── navigation/                   # Navigation config (10 files)
│   │
│   ├── mvvm/                         # 🆕 MVVM Architecture (620 files)
│   │   ├── features/
│   │   ├── components/
│   │   └── hooks/
│   │
│   ├── locales/                      # 🌐 i18n (12 locales)
│   │   ├── en/common.json
│   │   ├── fr/common.json
│   │   ├── de/common.json
│   │   └── [9 more languages]
│   │
│   ├── animations/                   # Lottie animations (66 files)
│   ├── icons/                        # Custom icons (85 files)
│   └── images/                       # Image assets (77 files)
│
├── ios/                              # iOS native project
├── android/                          # Android native project
├── e2e/                              # Detox E2E tests
├── fastlane/                         # Build automation
└── package.json
```

## Libraries Deep Dive

### ledger-live-common (libs/ledger-live-common/)

```
ledger-live-common/
├── src/
│   ├── bridge/                       # 🌉 Account bridges (55 files)
│   │   ├── jsHelpers.ts              # JS bridge helpers
│   │   └── sync.ts                   # Sync logic
│   │
│   ├── families/                     # Coin integrations (30 families)
│   │   ├── bitcoin/                  # Bitcoin family
│   │   ├── evm/                      # EVM family
│   │   ├── cosmos/                   # Cosmos family
│   │   └── [27 more]
│   │
│   ├── hw/                           # 🔌 Hardware SDK (86 files)
│   │   ├── actions/                  # Device actions
│   │   ├── getAddress.ts             # Address derivation
│   │   ├── signTransaction.ts        # Transaction signing
│   │   └── signMessage.ts            # Message signing
│   │
│   ├── deviceSDK/                    # Device SDK (42 files)
│   │   ├── actions/                  # High-level actions
│   │   ├── commands/                 # APDU commands
│   │   ├── hooks/                    # React hooks
│   │   └── tasks/                    # Background tasks
│   │
│   ├── exchange/                     # 💱 Exchange module (86 files)
│   │   ├── swap/                     # Swap functionality
│   │   ├── sell/                     # Off-ramp
│   │   └── providers/                # Exchange providers
│   │
│   ├── dada-client/                  # 📊 DADA API client (22 files)
│   │   ├── hooks/                    # React hooks
│   │   ├── state-manager/            # RTK Query
│   │   └── types/                    # Type definitions
│   │
│   ├── wallet-api/                   # Wallet API (56 files)
│   │   ├── server/
│   │   └── handlers/
│   │
│   ├── featureFlags/                 # Feature flags (18 files)
│   ├── market/                       # Market data (16 files)
│   ├── notifications/                # Push notifications
│   └── platform/                     # Live Apps platform (25 files)
```

### coin-modules (libs/coin-modules/)

```
coin-modules/
├── coin-bitcoin/                     # ₿ Bitcoin (142 files)
│   ├── src/
│   │   ├── bridge/                   # Account bridge
│   │   ├── hw-getAddress.ts          # Address derivation
│   │   ├── synchronization.ts        # Account sync
│   │   └── transaction.ts            # Transaction building
│
├── coin-evm/                         # Ξ EVM chains (150+ files)
│   ├── src/
│   │   ├── api/                      # RPC integration
│   │   ├── logic/                    # Business logic (34 files)
│   │   ├── staking/                  # Staking support
│   │   └── network/                  # Network clients
│   ├── docs/                         # Extensive docs (31 files)
│
├── coin-solana/                      # ◎ Solana
├── coin-cosmos/                      # ⚛ Cosmos
├── coin-polkadot/                    # ● Polkadot
├── coin-cardano/                     # Cardano
├── coin-tezos/                       # Tezos
├── coin-tron/                        # Tron
├── coin-xrp/                         # XRP
└── [21 more coin modules]
```

### ledgerjs (libs/ledgerjs/)

```
ledgerjs/
├── packages/
│   ├── hw-transport/                 # Base transport (abstract)
│   ├── hw-transport-node-hid/        # USB HID (Node.js)
│   ├── hw-transport-web-ble/         # Web Bluetooth
│   ├── hw-transport-webhid/          # WebHID
│   │
│   ├── hw-app-btc/                   # Bitcoin app interface
│   ├── hw-app-eth/                   # Ethereum app interface
│   ├── hw-app-solana/                # Solana app interface
│   ├── hw-app-cosmos/                # Cosmos app interface
│   └── [30+ hw-app packages]
│   │
│   ├── devices/                      # Device definitions
│   ├── errors/                       # Error types
│   ├── cryptoassets/                 # Crypto asset data
│   └── types-live/                   # TypeScript types
```

### UI Design System (libs/ui/)

```
ui/
├── packages/
│   ├── react/                        # 🖥️ Web components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── styles/
│   │
│   ├── native/                       # 📱 React Native components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── styles/
│   │
│   ├── icons/                        # 🎨 Icon library (542 SVGs)
│   │
│   └── shared/                       # Shared utilities
│
└── examples/                         # Usage examples
    ├── next.js/
    └── webpack.js/
```

## Critical Entry Points

| Application | Entry Point | Purpose |
|------------|-------------|---------|
| Desktop Main | `src/main/index.ts` | Electron main process |
| Desktop Renderer | `src/renderer/index.ts` | React application |
| Mobile | `index.js` → `src/App.tsx` | React Native app |
| CLI | `bin/index.js` | CLI entry |
| live-common | `src/index.ts` | Library exports |

## Integration Points

### Desktop ↔ ledger-live-common

```
Desktop imports:
- @ledgerhq/live-common/bridge/*
- @ledgerhq/live-common/families/*
- @ledgerhq/live-common/hw/*
- @ledgerhq/live-common/exchange/*
- @ledgerhq/live-common/dada-client/*
```

### Mobile ↔ ledger-live-common

```
Mobile imports:
- @ledgerhq/live-common/bridge/*
- @ledgerhq/live-common/families/*
- @ledgerhq/live-common/hw/*
- @ledgerhq/react-native-hw-transport-ble
```

### All Apps ↔ coin-modules

```
Via ledger-live-common:
- @ledgerhq/coin-bitcoin
- @ledgerhq/coin-evm
- @ledgerhq/coin-solana
- ... (30 coin modules)
```
