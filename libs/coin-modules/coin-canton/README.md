# coin-canton

This repository contains the Coin Canton module for Ledger Live.

## Overview

The Coin Canton module provides support for the Canton blockchain within the Ledger Live application

## Test setup

Create .env.integ.test file based on .env.integ.test.example

## Protobuf Integration

Protobuf generation and transaction splitting logic have been moved to `@ledgerhq/hw-app-canton`.

For protobuf generation instructions and details, see the [hw-app-canton README](../../ledgerjs/packages/hw-app-canton/README.md#protobuf-integration).

The `splitTransaction` function is now exported from `@ledgerhq/hw-app-canton` and should be imported from there instead of this package.
