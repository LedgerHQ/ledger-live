# Introduction

Playwright x Speculos: Simulate Device Testing for Ledger Live

# Pre-requisites

- Docker Desktop
- Speculos seed phrase

# Installation

## Ledger Live

Clone the _ledger-live_ repository and install dependencies:

```
git clone https://github.com/LedgerHQ/ledger-live.git`
pnpm i --filter="ledger-live-desktop..."`
pnpm build:lld:deps
```

## Speculos

Clone Speculos repository

```
git clone https://github.com/LedgerHQ/speculos.git
```

Once the repository is cloned, follow these steps:

- __Open Dockerfile__: Replace line #7

```
-FROM ghcr.io/ledgerhq/speculos-builder:latest AS builder
+FROM speculos-builder:latest AS builder
```
- __On Terminal__
```
docker build -t speculos-builder:latest -f build.Dockerfile .
docker build -f Dockerfile -t speculos:latest .
```
- __Test running speculos__
```
 docker run  --rm -it -v "$(pwd)"/apps:/speculos/apps \
-p 1234:1234 -p 5000:5000 -p 40000:40000 -p 41000:41000  -e SPECULOS_APPNAME=Bitcoin:2.0.1 speculos \
--model nanos ./apps/btc.elf --sdk 2.0 --seed "secret" --display headless --apdu-port 40000
```
> 💡 **Make sure AirPlay is disabled on Macs to avoid port conflicts.**

## Coin APPS

Clone CoinApps repository
```
git clone https://github.com/LedgerHQ/coin-apps.git
```

# Setup

Before executing tests for the first time, use the following commands:


```
export MOCK=0
export COINAPPS="/Users/firstname.lastname/coin-apps"
export SEED="secret"
export SPECULOS_IMAGE_TAG=speculos
```

The command `export COINAPPS="/Users/firstname.lastname/coin-apps` should be adjusted according to the location where the repository is cloned."

# Execution

## Build

Before executing any test, don’t forget to build the app, do it whenever the source code changed.

```
pnpm desktop build:testing
```

## Run tests

```
pnpm desktop test:playwright:speculos specs/speculos/<testName>
```
or
```
pnpm desktop test:playwright:speculos ./<testName> --config=tests/playwright.config.ts
```