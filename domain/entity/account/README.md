# @domain/entity-account

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The account aggregate root: the list of the app's accounts, keyed by `AccountUUID`, and the legacy ids every `@domain/entity-account-*` package is keyed by today.

## Accounts

The `accounts` slice is meant to become the source of truth of the account list. It is an entity adapter keyed by `AccountUUID`, described by zod schemas in `schema.ts`:

- `ids` — the accounts, in the user's order; it will replace the order of the legacy store.
- `entities` — one `{ accountUUID, descriptor, legacyId? }` per account (`AccountUUID` and `AccountDescriptor` from [`@domain/entity-account-descriptor`](../account-descriptor)); `legacyId` is absent for an account that only exists remotely.
- `byLegacyId` — the reverse index `legacyId → AccountUUID`, kept by the same reducer.

- `accountsSlice` — its reducer, `legacyAccountsSynced`, and its selectors.
- its selectors: `selectAccountEntries` / `selectAccountUUIDs` / `selectAccountEntry` — every account in order, their ids, or one by `AccountUUID`; `selectAccountUUIDByLegacyId` — the `AccountUUID` behind a legacy account id, from `byLegacyId`.
- `mockAccountEntry` (`./schema.mock`) — a valid entry, with overrides.

While the legacy store holds `accounts`, each app mounts the slice under another key and binds its selectors there with `accountsSlice.getSelectors`.

## Legacy (`src/legacy/`)

A compatibility layer for the migration, kept until the legacy `Account` is gone. Avoid it in new code: with the account models rework, an account is identified by its `AccountDescriptor` and `AccountUUID`.

- `AccountId` / `TokenAccountId` / `AnyAccountId` — the legacy ids: a top-level id has no `+`, a token account id is `<parentAccountId>+<encodedTokenId>`.
- `parseAnyAccountId` / `safeParseAnyAccountId`, `encodeTokenAccountId` / `getParentId`.
- `connectAccountsStore` — mirrors the legacy accounts into the slice whenever one is added, removed or reordered, whatever the action; an update of the accounts it already holds dispatches nothing. A legacy account never changes identity, so it is converted once, keyed by its legacy id. The app injects the conversion (`fromLegacyAccount` in live-common); an account it cannot convert is left out and reported to `onError`.

What an account *has* — a name, a balance, a history, a star — lives in its own `@domain/entity-account-*` package.

## Usage

```ts
import { AccountIdSchema, accountsSlice } from "@domain/entity-account";

const { selectAccountEntry, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: State) => state.accountEntries,
);

const entry = selectAccountEntry(state, accountUUID); // { accountUUID, descriptor, legacyId? }
// Only at the boundary with a legacy screen:
const uuid = selectAccountUUIDByLegacyId(state, AccountIdSchema.parse(legacyAccount.id));
```
