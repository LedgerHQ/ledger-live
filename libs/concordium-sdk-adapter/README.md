# Concordium SDK Adapter

Adapter module for `@concordium/web-sdk` to support both CommonJS (CJS) and ESM builds in `coin-concordium`.

## Problem

- `@concordium/web-sdk` is an ESM-only package
- `coin-concordium` must support both CJS and ESM builds (required by architecture)
- Direct imports of ESM-only packages in dual-format packages cause compatibility issues

**Note**: `@concordium/id-app-sdk` has been removed - its methods were reimplemented directly in `coin-concordium/src/network/onboard.ts`

## Solution

This adapter package:

1. **Imports** the ESM-only SDK package `@concordium/web-sdk`
2. **Bundles** it using Rollup (like `ethereum-provider`)
3. **Builds** both CJS and ESM outputs
4. **Re-exports** everything from web-sdk

## Architecture

```
┌─────────────────────────────────┐
│  @concordium/web-sdk (ESM)      │
└──────────────┬──────────────────┘
               │ import
               ▼
┌─────────────────────────────────┐
│ concordium-sdk-adapter          │
│ (rollup bundles ESM deps)       │
│ Entry points:                   │
│ - /web-sdk (re-exports)         │
│ - / (main, re-exports web-sdk)  │
│ - lib/*.js (CJS)                │
│ - lib-es/*.js (ESM)             │
└──────────────┬──────────────────┘
               │ import
               ▼
┌─────────────────────────────────┐
│ coin-concordium                 │
│ (dual CJS/ESM build)            │
│ - Uses web-sdk via adapter      │
│ - Reimplemented id-app-sdk      │
│   in network/onboard.ts         │
└─────────────────────────────────┘
```

## Benefits

- Follows existing patterns (`ethereum-provider`)
- Type-safe imports
- Type-only entry points enable optimal tree-shaking
- Proper dependency management
- Works with both CJS and ESM consumers

## Comments

We might want to move this to `coin-concordium` module

Also it will be required to include some additional polyfills to make it work with react-native on mobile
