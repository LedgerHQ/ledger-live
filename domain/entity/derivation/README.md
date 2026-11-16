# @domain/entity-derivation

> [!WARNING]
> **Status: UNSTABLE** — first implementation, its API may change.

The derivation modes of a currency, as data: which modes an account scan goes through, in which order, the path of each account, and when a mode stops (gap limit, `startsAt`, non-iterable modes, indexes a mode leaves to another, which mode offers a new account).

- `derivationModesOf(currency)`, `scanOf(currency, mode, rules)`, `offersNewAccount(currency, mode, rules)`.
- `candidateOf(currency, mode, index)`: an `AccountCandidate`, the network, `AccountPath` and `AddressPath` of one account. The device turns it into an `AccountDescriptor` by deriving its key.
- No string in the tables: a scheme goes through `derivationScheme("44'/<coin_type>'/…")`, checked when typed; currency ids through `byCurrency({…})` or `currencies(…)`, branded `CryptoCurrencyId`.

## A mirror of `derivation.ts`

[`modes.internals.ts`](src/modes.internals.ts) mirrors what a scan reads of [`libs/ledger-wallet-framework/src/derivation.ts`](../../../libs/ledger-wallet-framework/src/derivation.ts). Neither copy can import the other: the framework is published and this package is private ([crossing the frontier](../../../docs/monorepo-architecture.md#crossing-the-frontier)). The legacy copy is not deprecated: published coin modules import it and have no replacement they may use.

Change both in the same PR:

| `derivation.ts` | `modes.internals.ts` |
| --- | --- |
| `modes` (scan fields only) | `DERIVATION_MODES` |
| `legacyDerivations` | `LEGACY_MODES` |
| `disableBIP44` | `WITHOUT_BIP44` |
| `mandatoryEmptyAccountSkipByCurrency` | `MANDATORY_EMPTY_ACCOUNT_SKIP_BY_CURRENCY` |
| taproot ids in `getDerivationModesForCurrency` | `WITH_TAPROOT` |
| bitcoin branch of `shouldShowNewAccount` | `CREATABLE_MODES_BY_FAMILY` |

A new mode also goes in the `DerivationMode` union of `@ledgerhq/types-live`.
