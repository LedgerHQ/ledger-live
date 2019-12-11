# Coin Integration Introduction

Ledger Live Common is designed to have very generic models (for currencies, accounts) but to also facilitate new coin integrations and via different ways (pure JS implementation, lib-ledger-core integrations,...).

The way this is structured is the folder `src/families` would contain the only specific bits a coin family will have and the rest is factorized and generic.

The goal is to minimize the amount of effort to implement while guaranteeing the general library integrity (we want to avoid if logics in the generic parts).

## JS or Libcore bridge?

There are typically two possibilities in how a coin gets integrated: either we develop the integration in [lib-ledger-core](https://github.com/LedgerHQ/lib-ledger-core) (our in-house C++ core library – it's the case today for Bitcoin and Ethereum) or we integrate it in JavaScript to leverage on JavaScript ecosystem.

There are pros and cons in the different approach.

Typically we saw the more complex a coin is, the more likely we might have it solved by lib-ledger-core and avoid JS maintenance of the logic and crypto libraries to distribute on all targets (Node, React Native,..). Typically, ripple-lib has been challenging to get it work on React Native.

On the other hand, having it solved in JS is generally easier and the "developer experience" iteration is faster.

Interestingly, both implementation can exist at the same time, this is case for Ethereum and Ripple today and usually happens for legacy/evolution reason.

## A typical families folder

For each new coin integration, define a family for it (potentially one family of coin can contain many coins, for instance _Bitcoin Cash_ is in `bitcoin` family, _Ethereum Classic_ is in `ethereum` family). A family is a ledger specific technical grouping that put together the similar coins, typically those issued by a fork.

> The `family` is defined in the CryptoCurrency field.

For a new family, create a new folder in `src/families`.

The folder will have this kind of structure:

```
.
├── bridge
│   ├── js.js          # if relevant
│   ├── libcore.js     # if relevant
│   └── mock.js
├── cli-transaction.js # for the CLI
├── hw-getAddress.js
├── hw-signMessage.js  # if possible
├── transaction.js # transaction specific fields
├── types.js # family specific types
# if libcore is used
├── libcore-buildOperation.js
├── libcore-buildSubAccounts.js # if this concept even exists
├── libcore-buildTransaction.js
├── libcore-getAccountNetworkInfo.js
├── libcore-getFeesForTransaction.js
├── libcore-hw-signTransaction.js
├── libcore-signAndBroadcast.js
# for tests
├── test-dataset.js
└── test-specifics.js
```

most of these file are optional and you will typically see when a file implementation is missing when testing.

A coin would typically also have custom files to share code or expose families specific features.
