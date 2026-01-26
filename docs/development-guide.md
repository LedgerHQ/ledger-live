# Ledger Live - Development Guide

> **Generated:** 2026-01-23 | **Scan Level:** Exhaustive

## Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|-------------|
| **proto** | latest | [moonrepo.dev/proto](https://moonrepo.dev/docs/proto/install) |
| **Node.js** | (managed by proto) | Via `proto use` |
| **pnpm** | 10.24.0 | Via `proto use` |
| **Ruby** | 3.3.x | `brew install ruby@3.3` (macOS) |
| **bundler** | 2.5.7 | `gem install bundler:2.5.7` |
| **CocoaPods** | latest | `gem install cocoapods` |

### Platform-Specific

#### macOS (Desktop + Mobile)
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Ruby 3.3
brew install ruby@3.3

# Add to ~/.zshrc
export PATH=/opt/homebrew/opt/ruby@3.3/bin:$PATH
export PATH=$(gem environment gemdir)/bin:$PATH
```

#### Linux (Desktop Only)
```bash
# USB HID access
sudo apt-get install libusb-1.0-0-dev libudev-dev
```

#### Android Development
```bash
# Install Android Studio
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Installation

### 1. Clone Repository

```bash
git clone git@github.com:LedgerHQ/ledger-live.git
cd ledger-live
```

### 2. Setup Toolchain

```bash
# Install and activate correct Node.js/pnpm versions
proto use
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
pnpm i

# If you don't need postinstall scripts (faster)
pnpm i --ignore-scripts
```

### 4. Build Libraries

```bash
# Build all shared libraries
pnpm build:libs
```

## Development Commands

### Desktop Development

```bash
# Start development server with hot reload (with CORS bypass)
BYPASS_CORS=1 pnpm dev:lld

# With MSW mocking enabled
BYPASS_CORS=1 pnpm dev:lld:msw

# With debugging (DevTools + remote debugging)
BYPASS_CORS=1 pnpm dev:lld:debug

# Run desktop tests
pnpm desktop test:jest
pnpm desktop test:playwright
```

### Mobile Development

```bash
# Install iOS dependencies
pnpm mobile pod

# Start Metro bundler
pnpm dev:llm

# With MSW mocking
pnpm dev:llm:msw

# Run on iOS simulator
pnpm mobile ios

# Run on Android emulator
pnpm mobile android

# Run mobile tests
pnpm mobile test:jest
```

### Library Development

```bash
# Build specific library
pnpm build:llc          # ledger-live-common
pnpm build:ljs          # ledgerjs packages
pnpm build:coin         # coin modules

# Watch mode for development
pnpm watch:common       # ledger-live-common
pnpm watch:ljs          # ledgerjs packages
pnpm watch:coin         # coin modules
```

### CLI Development

```bash
# Build and run CLI
pnpm build:cli
pnpm run:cli <command>

# Development mode
pnpm dev:cli
```

## Common Tasks

### Adding a Dependency

```bash
# Add to specific package
pnpm --filter ledger-live-desktop add <package>
pnpm --filter live-mobile add <package>
pnpm --filter @ledgerhq/live-common add <package>

# Add to workspace root (dev dependency)
pnpm add -w -D <package>
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm desktop test:jest
pnpm mobile test:jest
pnpm common test

# Run with coverage
pnpm desktop test:jest:coverage
pnpm mobile test:jest:coverage

# Run E2E tests
pnpm desktop test:playwright
pnpm mobile e2e:test
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Fix lint issues
pnpm lint:fix

# Typecheck
pnpm typecheck

# Format code
pnpm desktop prettier
pnpm mobile prettier
```

### Using Aliases

The monorepo provides convenient aliases for packages:

```bash
# Instead of: pnpm --filter ledger-live-desktop
pnpm desktop <command>

# Instead of: pnpm --filter live-mobile
pnpm mobile <command>

# Instead of: pnpm --filter @ledgerhq/live-common
pnpm common <command>

# Coin modules
pnpm coin:bitcoin <command>
pnpm coin:evm <command>
pnpm coin:solana <command>
```

## Build Commands

### Desktop Builds

```bash
# Development build
pnpm desktop build:js

# Staging build (unsigned)
pnpm build:lld

# Production release
pnpm desktop release

# Nightly build
pnpm desktop nightly
```

### Mobile Builds

```bash
# iOS Ad-Hoc (local)
pnpm mobile ios:local:ipa

# Android APK (local)
pnpm mobile android:apk:local

# iOS TestFlight (CI)
pnpm mobile ios:ci:testflight

# Android Play Store (CI)
pnpm mobile android:ci:playstore
```

## Working with Scopes

Turborepo and pnpm support powerful filtering:

```bash
# Build only affected packages
pnpm lint --filter=[origin/develop]

# Build package and its dependencies
pnpm build --filter="ledger-live-desktop..."

# Build package dependents
pnpm build --filter="...@ledgerhq/live-common"

# Exclude packages
pnpm test --filter="!./apps/*"
```

## Debugging

### Desktop Debugging

```bash
# Enable DevTools and remote debugging
DEV_TOOLS=1 LEDGER_INTERNAL_ARGS=--inspect ELECTRON_ARGS=--remote-debugging-port=8315 pnpm dev:lld
```

### Mobile Debugging

```bash
# Enable React Native debugger
pnpm mobile start

# Use Flipper or React Native DevTools
# The app automatically connects when running in development mode
```

### Jest Debugging

```bash
# Desktop
pnpm desktop test:jest:debug

# Mobile
pnpm mobile test:jest:debug

# Common
pnpm common jest:debug
```

## Environment Variables

### Desktop (.env)

```bash
# Enable MSW mocking
ENABLE_MSW=true

# Enable staging environment
STAGING=1

# Enable testing mode
TESTING=1
```

### Mobile (.env.*)

```bash
# .env.ios.staging, .env.android.staging, etc.
# Managed via react-native-config
```

## Troubleshooting

### Common Issues

#### Out of sync Podfile.lock
```bash
rm -rf ~/.cocoapods/
pnpm clean && pnpm store prune && proto use && pnpm i && pnpm build:llm:deps
pnpm mobile pod
```

#### Node modules issues
```bash
pnpm clean      # git clean -fdX
pnpm i
```

#### Metro bundler issues (Mobile)
```bash
# Clear Metro cache
pnpm mobile start --reset-cache

# Clean Android build
pnpm mobile android:gradleClean
```

#### Electron build issues
```bash
# Reinstall app dependencies
pnpm desktop install-deps
```

## Changeset Workflow

### Creating a Changeset

```bash
# Add a changeset for your changes
pnpm changelog

# Follow prompts to select:
# - Affected packages
# - Bump type (patch/minor/major)
# - Description
```

### Version Bumping

```bash
# Bump versions based on changesets (maintainers only)
pnpm bump
```

## IDE Setup

### Recommended Extensions (VS Code / Cursor)

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Styled Components Syntax Highlighting
- Tailwind CSS IntelliSense

### Workspace Settings

The repository includes `.vscode/` configuration for:
- Recommended extensions
- Editor settings
- Debug configurations
