# @features/platform-persistence-accounts

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The `accounts` record of persistence, for all the writers of stored accounts: Ledger Wallet
Desktop, Ledger Wallet Mobile and `apps/cli` (with the e2e seeds). It holds what must be the same
for all of them. Each app injects its own account model.

## What the package holds

- The stored shape of 1 account, `accountEnvelopeSchema`: a strict `{ data, version }`. `data`
  stays loose (`id` and `currencyId` only), and `version`, optional, goes from 0 to the line length.
- The version line, `ACCOUNTS_VERSION_LINE`: `idFormat2018` → `aptosHardenedPath` →
  `cryptoOrgResources`. Each app keeps the code of the steps and its own version count, as today:

  | Writer | Reads | Writes |
  | --- | --- | --- |
  | Desktop | the stored version, 0 to 3; no version runs no step, as the legacy load did | 3 |
  | Mobile | the stored version, but a stored 1 or no version reads as 0 (LIVE-40516) | 2 |
  | `apps/cli`, e2e seeds | ignores it | 1 (`CLI_WRITTEN_VERSION`) |

  Mobile has no `idFormat2018` step, so a mobile version counts 1 step less than the line. All
  the mobile data stored before LIVE-40516 has version 1, so a stored 1 runs the 2 mobile steps.

- The record versions, `accountsVersions`: v0 is the stored shape of today,
  `accountEnvelopeSchema`, with no `$v`. A new version of the record is a `.next` here.
- `defineAccountsRecord({ codec, state })`: the collection record, with `accountsVersions`. The
  app gives 2 groups:
  - `codec`, the stored account and back: `decode(stored)`, `decodedId(decoded)` and
    `encode(account, state)`.
  - `state`, its Redux state: `select(state)`, `changed(previous, next)` and
    `toHydrationActions(decoded)`, which runs only at hydration.
- For the tools (`apps/cli`, e2e seeds):
  - `defineAccountsCodec(codec)`: the same codec with no Redux state.
  - `parseStoredAccount(stored)`: upgrades 1 stored account to the latest record version.
  - `encodeRawAccount(raw)`: a raw account at `CLI_WRITTEN_VERSION`, encoded at the latest record
    version.
  - `encodeStoredAccount(account)`: a stored account, encoded at the latest record version.
  - `accountsNotStored(stored, accounts)`: the accounts whose id is not stored yet, to encode
    before `appendAccounts`.
  - `appendAccounts(stored, added)` and `storedAccountId(stored)`: the id of an account of any
    record version, newer included.

## Rules

- 2 versions: the legacy `version` of each account counts the steps of the line. The record
  version, `$v`, comes from `accountsVersions`. Never use the legacy `version` for a new version.
- An account above legacy version 3, or with an envelope key that this app does not know, does not
  decode. Persistence reports it (no value, no account id) and keeps it stored as it is, as any
  account that does not reach the state: a read or decode failure, or an account of a currency
  that this app does not support.
- An account with a `$v` above the latest version comes from a newer app: a "newer" report. It
  stays stored and hidden. An account with the same id in the state does not replace it.
- Each writer encodes through this package, never with a fixed `$v`.
- The account name and the starred flag have 2 owners: the account `data` and the `wallet` record.
  The record writes them from the wallet state, as today. At start, the desktop imports the wallet
  state after the accounts, so its names win (LIVE-41517).

## Add a version

- The legacy `ACCOUNTS_VERSION_LINE` is frozen. Do not add a step to it.
- A new version is `accountsVersions.next(schema, step)`. Follow the
  [record-versions-and-migrations skill](../../../.agents/skills/record-versions-and-migrations/SKILL.md).
