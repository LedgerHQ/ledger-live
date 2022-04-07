# Coin Integration Introduction

Ledger Live Common is designed to have very generic models (for currencies, accounts) but to also facilitate new coin integrations and via different ways (pure JS implementation,...).

The way this is structured is the folder `src/families` would contain the only specific bits a coin family will have and the rest is factorized and generic.

The goal is to minimize the amount of effort to implement while guaranteeing the general library integrity (we want to avoid if logics in the generic parts).

## A typical families folder

For each new coin integration, define a family for it (potentially one family of coin can contain many coins, for instance _Bitcoin Cash_ is in `bitcoin` family, _Ethereum Classic_ is in `ethereum` family). A family is a ledger specific technical grouping that put together the similar coins, typically those issued by a fork.

> The `family` is defined in the CryptoCurrency field.

For a new family, create a new folder in `src/families`.

The folder will have this kind of structure:

```
.
├── bridge
│   ├── js.ts
│   └── mock.ts
├── cli-transaction.ts # for the CLI
├── hw-getAddress.ts
├── hw-signMessage.ts  # if possible
├── transaction.ts # transaction specific fields
├── types.ts # family specific types
# for tests
└── test-dataset.ts
```

most of these file are optional and you will typically see when a file implementation is missing when testing.

A coin would typically also have custom files to share code or expose families specific features.
