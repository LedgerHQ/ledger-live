# Ledger Live Documentation Index

> **Generated:** 2026-01-23 | **Mode:** Initial Scan | **Scan Level:** Exhaustive

## Project Overview

- **Name:** `@ledgerhq/ledger-live`
- **Type:** Monorepo with 9 parts
- **Primary Stack:** TypeScript, React, React Native, Electron
- **Architecture:** Component-Based with MVVM migration

---

## Quick Reference

### Applications

| Part | Type | Tech | Entry Point |
|------|------|------|-------------|
| **ledger-live-desktop** | Desktop | Electron 39.2.7 | `apps/ledger-live-desktop/` |
| **ledger-live-mobile** | Mobile | React Native 0.79.7 | `apps/ledger-live-mobile/` |
| **cli** | CLI | Node.js | `apps/cli/` |
| **web-tools** | Web | React | `apps/web-tools/` |

### Core Libraries

| Part | Purpose | Entry Point |
|------|---------|-------------|
| **ledger-live-common** | Shared business logic | `libs/ledger-live-common/` |
| **ledgerjs** | Hardware wallet SDK | `libs/ledgerjs/` |
| **coin-modules** | 30 blockchain integrations | `libs/coin-modules/` |
| **ui** | Design system | `libs/ui/` |
| **ledger-services** | Backend service clients | `libs/ledger-services/` |

---

## Generated Documentation

### Core Documents

- [Project Overview](./project-overview.md) - Executive summary, structure, and tech stack
- [Source Tree Analysis](./source-tree-analysis.md) - Detailed directory structure and file organization

### Architecture Documents

- [Architecture - Desktop](./architecture-desktop.md) - Electron app architecture and patterns
- [Architecture - Mobile](./architecture-mobile.md) - React Native app architecture and patterns
- [Architecture - Libraries](./architecture-libraries.md)

### Development Guides

- [Development Guide](./development-guide.md) - Setup, commands, and workflows
- [Testing Guide](./testing-guide.md)
- [Contribution Guide](./contribution-guide.md)

### API & Integration

- [API Contracts](./api-contracts.md)
- [Integration Architecture](./integration-architecture.md)

---

## Existing Documentation

### Root Level

- [README.md](../README.md) - Main project documentation
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

### Application READMEs

- [Desktop README](../apps/ledger-live-desktop/README.md)
- [Mobile README](../apps/ledger-live-mobile/README.md)
- [CLI README](../apps/cli/README.md)
- [Web Tools README](../apps/web-tools/README.md)

### Library READMEs

- [ledger-live-common README](../libs/ledger-live-common/README.md)
- [ledgerjs README](../libs/ledgerjs/README.md)
- [coin-modules README](../libs/coin-modules/README.md)
- [UI Design System README](../libs/ui/README.md)

### Specialized Documentation

- [DADA Client README](../libs/ledger-live-common/src/dada-client/README.md) - RTK Query data client
- [EVM Coin Module Docs](../libs/coin-modules/coin-evm/docs/) - 31 documentation files

---

## Getting Started

### For New Developers

1. Read the [Project Overview](./project-overview.md) to understand the codebase structure
2. Follow the [Development Guide](./development-guide.md) for setup instructions
3. Review the architecture document for your target platform:
   - Desktop: [Architecture - Desktop](./architecture-desktop.md)
   - Mobile: [Architecture - Mobile](./architecture-mobile.md)

### For Feature Development

1. Check if your feature touches existing `families/` code (coin-specific)
2. New features should follow the [MVVM pattern](./architecture-desktop.md#mvvm-migration) in `mvvm/` directories
3. Include integration tests in `__integrations__/` folders

### For Blockchain Integration

1. Review the [coin-modules README](../libs/coin-modules/README.md)
2. Use [coin-module-boilerplate](../libs/coin-modules/coin-module-boilerplate/) as a starting point
3. Follow the bridge pattern in `ledger-live-common/bridge/`

---

## Key Patterns & Conventions

### MVVM Architecture

New features follow Container → ViewModel → View pattern:
```
mvvm/features/FeatureName/
├── screens/
│   └── ScreenName/
│       ├── index.tsx                  # Container
│       ├── useScreenNameViewModel.ts  # ViewModel
│       └── types.ts                   # Types
└── __integrations__/                  # Integration tests
```

### RTK Query Data Fetching

Use `dada-client` or `cal-client` patterns for API integration:
```typescript
import { useAssetsData } from '@ledgerhq/live-common/dada-client/hooks/useAssetsData';
```

### Testing Strategy

- Unit tests: Jest, co-located with source files
- Integration tests: `__integrations__/` folders, MSW for mocking
- E2E tests: Playwright (desktop), Detox (mobile)

---

## CI/CD Workflows

73 GitHub Actions workflows in `.github/workflows/`:

| Category | Key Workflows |
|----------|---------------|
| **Build** | `build-desktop-reusable.yml`, `build-mobile-reusable.yml` |
| **Test** | `test-desktop-reusable.yml`, `test-mobile-reusable.yml` |
| **Release** | `release-final.yml`, `release-prerelease.yml` |
| **Coin Testing** | `bot-testing-*.yml`, `coin-monitoring-*.yml` |

---

## Useful Commands

```bash
# Development
BYPASS_CORS=1 pnpm dev:lld      # Desktop dev server
pnpm dev:llm                    # Mobile Metro bundler

# Building
pnpm build:libs                 # All libraries
pnpm build:lld                  # Desktop app
pnpm build:llm:deps             # Mobile dependencies

# Testing
pnpm desktop test:jest          # Desktop unit tests
pnpm mobile test:jest           # Mobile unit tests
pnpm desktop test:playwright    # Desktop E2E

# Utilities
pnpm lint                       # Lint all packages
pnpm typecheck                  # Type check all packages
```

---

## Links

- **GitHub Repository**: https://github.com/LedgerHQ/ledger-live
- **Developer Portal**: https://developers.ledger.com
- **Wiki**: https://github.com/LedgerHQ/ledger-live/wiki
- **Issues**: https://github.com/LedgerHQ/ledger-live/issues

---

*This documentation was generated by the BMAD Document Project workflow.*
