# @domain/entity-derivation

> [!CAUTION]
> **Status: EXPLORATION** — API still being designed.

The derivation modes of a currency, as data: which modes an account scan goes through, in which order, the path of each account, and when a mode stops (gap limit, `startsAt`, non-iterable modes, indexes a mode leaves to another, which mode offers a new account).

- `derivationModesOf(currency)`, `scanOf(mode, rules)`, `offersNewAccount(currency, mode, rules)`.
- `candidateOf(currency, mode, index)`: an `AccountCandidate`, the network and paths of one account. The device turns it into an `AccountDescriptor` by deriving its key.
- No family check in code: what differs per currency or family is a table (`LEGACY_MODES`, `WITHOUT_BIP44`, `WITH_TAPROOT`, `CREATABLE_MODES_BY_FAMILY`).

It holds the fields of `libs/ledger-wallet-framework/src/derivation.ts` a scan reads, copied by hand for the PoC: the next step is for `derivation.ts` to read this table, so the two cannot drift.
