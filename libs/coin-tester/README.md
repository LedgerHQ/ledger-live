# Coin-tester

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

## Troubleshooting

### EVM Coin tester

> The \"RPC\" variable is not set. Defaulting to a blank string.

This error can safely be ignored. The RPC is passed as a variable env at runtime. Check [here](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-modules/coin-evm/src/__tests__/coin-tester/anvil.ts#L28) and [here](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-modules/coin-evm/src/__tests__/coin-tester/scenarios/ethereum.ts#L144)
