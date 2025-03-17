# Introduction

Playwright x Speculos: Simulate Device Testing for Ledger Live

# Pre-requisites

- Docker Desktop
- Speculos seed phrase

# Installation

## Ledger Live

Clone the _ledger-live_ repository and install dependencies:

HTTPS: `git clone https://github.com/LedgerHQ/ledger-live.git`  
SSH `git clone git@github.com:LedgerHQ/ledger-live.git`

```
pnpm i --filter="ledger-live-desktop..."
pnpm build:lld:deps
```

## Speculos

Clone Speculos repository

HTTPS: `git clone https://github.com/LedgerHQ/speculos.git`  
SSH: `git clone git@github.com:LedgerHQ/speculos.git`

Once the repository is cloned, follow these steps:

- **Open Dockerfile**: Replace line #7

```
-FROM ghcr.io/ledgerhq/speculos-builder:latest AS builder
+FROM speculos-builder:latest AS builder
```

- **On Terminal**

```
docker build -t speculos-builder:latest -f build.Dockerfile .
docker build -f Dockerfile -t speculos:latest .
```

- **Test running speculos**

```
 docker run  --rm -it -v "$(pwd)"/apps:/speculos/apps \
-p 1234:1234 -p 5000:5000 -p 40000:40000 -p 41000:41000  -e SPECULOS_APPNAME=Bitcoin:2.0.1 speculos \
--model nanos ./apps/btc.elf --sdk 2.0 --seed "secret" --display headless --apdu-port 40000
```

> 💡 **Make sure AirPlay is disabled on Macs to avoid port conflicts.**

## Coin APPS

Clone CoinApps repository

HTTPS: `git clone https://github.com/LedgerHQ/coin-apps.git`  
SSH: `git@github.com:LedgerHQ/coin-apps.git`

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
pnpm build:lld
pnpm build:cli
pnpm desktop build:testing
```

Please do the setup command if not done yet

```
pnpm desktop test:playwright:setup
```

## Run tests

```
pnpm desktop test:playwright:speculos <testFileName>
```
