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

- `defineAccountsRecord({ codec, state })`: the collection record, v0 (the stored shape of
  today). The app gives 2 groups:
  - `codec`, the stored account and back: `decode(stored)`, `decodedId(decoded)` and
    `encode(account, state)`.
  - `state`, its Redux state: `select(state)`, `changed(previous, next)` and
    `toHydrationActions(decoded)`, which runs only at hydration.
- For the tools: `defineAccountsCodec(codec)`, the same codec with no Redux state, and
  `appendAccounts`, `parseStoredAccount`, `storedAccountId` and `wrapRaw(raw)`.
- 2 versions: the `version` of each stored account counts the steps of the line, as today. The
  record `version` (`ACCOUNTS_RECORD_VERSION`, 0) labels the reports and the schema snapshot.

## Rules

- An account above version 3, or with an envelope key that this app does not know, comes from a
  newer app: it does not decode. Persistence reports it (no value, no account id) and keeps it
  stored as it is, as any account that does not reach the state: a read or decode failure, or an
  account of a currency that this app does not support.
- The account name and the starred flag have 2 owners: the account `data` and the `wallet` record.
  The record writes them from the wallet state, as today. At start, the desktop imports the wallet
  state after the accounts, so its names win (LIVE-41517).

## Add a step

1. Add the step code to the account model of each app that writes accounts. Each app has a test
   that its model fits the line.
2. Add the step name at the end of `ACCOUNTS_VERSION_LINE`. The schema then accepts the new
   version.
3. Update the schema snapshot: its maximum version changes. `ACCOUNTS_RECORD_VERSION` stays 0
   until the envelope itself changes.
4. Set the minimum app version: an older app keeps the new accounts stored and does not show them
   until the user updates.
