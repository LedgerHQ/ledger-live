# @domain/entity-account-alias

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

## Why

`account.id` embeds derivation data in plain text:

```
js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy:segwit
```

Every surface that carries an account id therefore leaks an xpub or an address: route paths, the
`page` property of analytics events, breadcrumbs, logs. This package provides the aliasing layer
that keeps those surfaces free of PII, without changing the account id itself.

## How

`computeAccountAlias(accountId)` returns `uuidv5(accountId, <private namespace>)`. It is:

- **deterministic** — same id, same alias, across sessions and devices, so an alias can be stored
  in a URL or in navigation state;
- **one-way** — an alias carries no address or xpub (see the limit below);
- **memoized** — hashing happens once per account id.

**What this does and does not buy.** It stops account ids from reaching analytics, logs and route
paths in plaintext. It is not unlinkability: the namespace ships in the binary, so an alias can be
confirmed against a candidate address, and one wallet produces the same alias on every install. A
per-installation namespace would close that at the cost of persisting it; routes only need
stability within an install, so it remains an option.

The reverse direction needs state: `accountAliasSlice` holds `accountIdByAlias`, filled by
`registerAccountAliases(accountIds)` and read back with `accountIdFromAliasSelector` /
`resolveAccountIdSelector`. Apps must register the ids (main **and** token accounts) whenever the
account list changes, before any alias can be resolved.

## Main exports

| Export | Direction |
| --- | --- |
| `computeAccountAlias(accountId)` | id → alias, pure |
| `registerAccountAliases(accountIds)` | feeds the reverse map |
| `accountIdFromAliasSelector(state, alias)` | alias → id, `undefined` when unknown |
| `resolveAccountIdSelector(state, segment)` | alias → id, falls back to the segment itself |

`resolveAccountIdSelector` is the one to use at a route boundary: a link created before this
package existed still carries a raw account id, and must keep working.

## Related

- `libs/ledger-live-common/src/wallet-api/converters.ts` — same `uuidv5` scheme, other namespace
