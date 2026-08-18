# ledger-wallet-framework

> [!CAUTION]
> **Status: UNSTABLE** — Actively consolidating shared logic migrated out of `@ledgerhq/live-common`; API is in flux.

`@ledgerhq/ledger-wallet-framework` is the core wallet logic framework that consolidates shared infrastructure for coin implementations in Ledger Live. It was introduced to centralize concerns that previously lived in `ledger-live-common` or were duplicated across coin modules, extending and wrapping `@ledgerhq/coin-module-framework`.

## What it does

- Defines the **bridge interface** (account sync, transaction signing, broadcast) that all coin bridges implement
- Provides **account** utilities: account creation, balance aggregation, sub-account handling
- Implements **operation** parsing and merging logic shared across coin families
- Handles **transaction** building, fee estimation types, and status computation contracts
- Provides **derivation** path utilities and helpers
- Includes **NFT** data structures and helpers
- Provides **serialization** helpers for accounts and transactions (for persistence and inter-process communication)
- Exports **bot** testing infrastructure for automated wallet scenario tests
- Offers **mocks** for testing without a real device
- Includes a **sanction** checking integration and **tracking** event helpers

## Key exports / concepts

- `Bridge` types and base implementations (account bridge, currency bridge)
- `Account`, `SubAccount`, `TokenAccount` types and utilities
- `Operation` creation, merging, and pagination helpers
- `Transaction` base types and `TransactionStatus`
- `derivation` — BIP32/BIP44 path calculation per coin family
- `BotScenario` and test runner helpers
- `serialize` / `deserialize` for accounts

## Usage context

Used by all coin family implementations (`libs/coin-modules/*`, `libs/ledger-live-common`) and by the desktop/mobile apps indirectly through the coin bridge layer. It is the foundational dependency for anything that needs to interact with wallet state or hardware signing.
