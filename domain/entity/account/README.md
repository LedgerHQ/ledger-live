# @domain/entity-account

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The account aggregate root: the list of the app's accounts, keyed by `AccountUUID`, and the legacy ids every `@domain/entity-account-*` package is keyed by today.

## Accounts

The `accounts` slice is meant to become the source of truth of the account list. It is an entity adapter keyed by `AccountUUID`, described by zod schemas in `schema.ts`:

- `ids` — the accounts, in the user's order; it will replace the order of the legacy store.
- `entities` — one `{ accountUUID, descriptor, legacyId? }` per account (`AccountDescriptor` from [`@domain/entity-account-descriptor`](../account-descriptor)); `legacyId` is absent for an account that only exists remotely.
- `byLegacyId` — the reverse index `legacyId → AccountUUID`, kept by the same reducer.

- `AccountUUIDSchema` / `AccountUUID` — the identity code holds: a uuid v5 of the descriptor's canonical key, the same on every device, carrying no account key.
- `computeAccountUUID` (`./descriptor`) — the `AccountUUID` of a descriptor; only the edges call it, tests take the wrapper of `./schema.mock`.
- `accountsSlice` — its reducer, `legacyAccountsSynced`, and its selectors.
- its selectors: `selectAccountEntries` / `selectAccountUUIDs` / `selectAccountEntry` — every account in order, their ids, or one by `AccountUUID`; `selectAccountUUIDByLegacyId` — the `AccountUUID` behind a legacy account id, from `byLegacyId`.
- `mockAccountEntry` (`./schema.mock`) — a valid entry, with overrides.

While the legacy store holds `accounts`, each app mounts the slice under another key and binds its selectors there with `accountsSlice.getSelectors`.

## Discovered accounts

The `discoveredAccounts` slice registers the accounts discovery found and the user has not added: `AccountUUID → AccountDescriptor`, nothing else. It lets `@features/platform-account-data` read their data (a balance on the scan screen) while the flow holds only `AccountUUID`s.

- `discoveredAccountsRegistered` — dispatched at the edge by `registerDiscoveredAccounts` (`@features/platform-account-discovery/descriptor`) for UUIDs not already in the accounts slice.
- `discoveredAccountsCleared` — dispatched by the flow when it ends or its scan restarts.
- `selectDiscoveredAccountDescriptor` — the descriptor of a discovered account, for the edges.
- An account added to the `accounts` slice (`legacyAccountsSynced`, `remoteAccountsAdded`) leaves the register: its data, keyed by the same `AccountUUID`, stays where it is.

Each app mounts it at `discoveredAccounts`, its name.

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
