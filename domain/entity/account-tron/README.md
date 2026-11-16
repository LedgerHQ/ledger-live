# @domain/entity-account-tron

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The Tron family's kinds: what only a Tron account shows. The first family-owned kind, named `"<family>:<concept>"` and declared here rather than in a generic package.

## Scope

- **Answers** `"tron:resources"`: the energy, bandwidth and Tron power of a Tron account.
- **Read by** the Tron account page footer.
- **Out of scope**: frozen and unfreezing TRX, which are part of the balance (`balance` kind, `locked` with `frozen` and `unbonding`); votes and rewards (a staking kind); legacy frozen amounts and their expiry dates.
- A non-Tron account is not served: a source rejects it, and the read fails with `NoAccountDataSourceError`.

## Model

- `"tron:resources"`, no query, `TronResources`:
  - `energy`: energy points left, an integer string.
  - `bandwidth`: `{ freeUsed, freeLimit, gainedUsed, gainedLimit }`, integer strings: the daily free allowance and what frozen TRX gained, each with its use.
  - `tronPower`: the votes the account can cast, an integer.
- The slice keys each `AccountUUID` to `{ revision, resources }`: an older answer never replaces a newer one.
- `selectTronResources(state, accountUUID)` and `selectTronAvailableBandwidth(state, accountUUID)`, the bandwidth left (`freeLimit + gainedLimit - gainedUsed - freeUsed`). Apps mount the slice at `accountTron`.

Not a fetch status: pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-models/data-layer.md).
