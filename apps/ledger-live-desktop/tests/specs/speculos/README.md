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
Then, follow the instructions for your device: [Speculos](https://speculos.ledger.com/).

## Coin APPS

Clone CoinApps repository
```
git clone https://github.com/LedgerHQ/coin-apps.git
```

# Setup


# Setup

Before executing tests for the first time, use the following commands:


```
export MOCK=0
export COINAPPS="/Users/firstname.lastname/coin-apps"
export SEED="secret"
```

"The command export COINAPPS="/Users/firstname.lastname/coin-apps" should be adjusted according to the location where the repository is cloned."

# Execution

## Build

Before executing any test, don’t forget to build the app, do it whenever the source code changed.

```
pnpm desktop build:testing
```

## Run tests

```
pnpm desktop test:playwright:speculos specs/<testFolder>/<testName>
```