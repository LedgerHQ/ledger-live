# @ledgerhq/disable-network-setup

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This module disables all real network access during tests.

It’s designed for use with Jest to enforce isolated and reliable test environments.

## Purpose

Prevents real HTTP requests during tests

## Usage

Add this package as dev dependency and to your Jest config:

```
setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"]
```
