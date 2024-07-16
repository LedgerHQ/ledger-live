# What is the coin tester

The coin tester is a deterministic tool to test the coin modules.

## Motivation

Historically to test the coin modules we had to run Ledger Live and test manually the different operations supported on Ledger Live. However we wanted to make sure that the coin modules could be used in Ledger Live as well as any other software wallet. We thus needed a way to easily test the full capabilities of a coin modules without relying on the client specific use cases.

## How it works

The coin tester executes **scenarios**. A scenario is a suite of transactions that are run together.

A scenario could look like:

> Send 1 Eth to Alice
> Send 1 NFT to Bob
> Stake 100 Eth to this staking pool 

You'll just need to define the transactions as expected by the coin module and then let the coin module do the job

The coin modules works quite simply:

1. Setup: During the setup we spawn the local test node and the transaction signer. It returns the [CurrencyBridge](https://github.com/LedgerHQ/ledger-live/wiki/LLC:CurrencyBridge), [AccountBridge](https://github.com/LedgerHQ/ledger-live/wiki/LLC:AccountBridge) and an account.
2. (optional )We run additional checks if they are defined
3. We loop through the array of transaction and execute the transactions. For each transaction we check that the coin module acted as expected.
4. We teardown the setup

The coin tester being deterministic, the goal of the setup is to make sure we always tests in a known and controlled environment. The account we use should have the funds and assets (NFTs, Tokens, ERC20s, etc) to execute the scenarios transactions.

As transactions are ran in a local testnode we can't use a "real" explorer, we thus use the functions `beforeSync` and `mockIndexer` locally index transactions.
Everytime we do a synchronization we intercept the calls made to the explorer and populate the response with the local explorer.

## Prerequisites to implement the coin tester for a coin module

- A coin module: All the logic to craft and broadcast a transaction. The coin module must be "coin configurable" meaning it must implement a `setConfiguration` function and use `getConfiguration` in the implementation.

- A tool that can spawn a fresh local test node. Best practice is to run it inside a Docker container.


## Engine

The coin tester engine is located [here](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/src/main.ts). The function `executeScenario` is then imported inside the coin module to run specific scenarios.

## Examples

- [EVM](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/coin-modules/coin-evm/src/__tests__/coin-tester)
- [Polkadot](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/coin-modules/coin-polkadot/src/test/coin-tester)
