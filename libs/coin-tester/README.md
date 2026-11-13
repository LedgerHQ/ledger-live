# Coin-tester

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

- [Setup](#setup)
- [Run tests for a coin module](#runtests)

## What is the coin config

Find more information [here](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/coin-tester.md)

## [Setup](#setup)

### Prerequisites

- Ledger Live development setup

```sh
git clone git@github.com:LedgerHQ/ledger-live.git
cd ledger-live
pnpm install
pnpm build:libs
```

- [Docker](https://docs.docker.com/engine/install)

### Coin Module Specific setup

#### Polkadot

To coin Polkadot Coin tester we will need to build the local test node Docker image.

## [Run tests for a coin module](#run-tests-for-a-coin-module)

```sh
pnpm coin:tester:<coin-tester-modules-name> start

# e.g
# pnpm coin:tester:evm start
# pnpm coin:tester:polkadot start
# pnpm coin:tester:solana start
# pnpm coin:tester:bitcoin start
```

### Versions of the coin-sandbox testers

The testers that run on [coin-sandbox](https://github.com/LedgerHQ/coin-sandbox) (EVM, Solana, Tron, Polkadot, Bitcoin, Cosmos, XRP) do not write the version of their node and indexer. The scenario reads it from one variable per network, `COIN_SANDBOX_<NETWORK>`, holding the flags of coin-sandbox's `up` (`src/versions.ts`):

```sh
export COIN_SANDBOX_ETHEREUM='--node geth@1.17.9 --indexer atlas@2.38.16'
pnpm coin:tester:evm start -t "scenario Ethereum"
```

In CI the matrix of `.github/workflows/test-coin-tester.yml` (`COIN_SANDBOX_NETWORKS`) is the only place the versions are written: it exports these variables and pulls exactly those images with `deno task pull <network> <flags>`. Nothing is defaulted, a missing variable is an error that names it. Run `deno task chain networks` in coin-sandbox for the networks, and read `capabilities.json` there for the versions it accepts.
