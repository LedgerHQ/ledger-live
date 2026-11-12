# @domain/entity-account-status

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

Two kinds, read apart: `accountStatus`, whether an account was ever used and what it must do on chain before it transacts, and `assetStatus`, what it must do before it holds one asset.

## Scope

- **Answers** whether the account was ever used, the account gate that blocks receiving or sending, and per asset the gate that blocks holding it.
- **Read by** the receive and send screens, through `receiveGate` and `sendGate`, and by account discovery through `exists`.
- **Out of scope**: the receive address and its verification (`receive`), balances, Zcash per address included (`balance`), staking and delegation, Tezos delegated included (a staking kind), memo or tag (`receive` or the family).
- **A new gate** is a chain precondition that blocks an action on the account or on an asset, never data nor a display preference.

## Model

Every answer mirrors what the app decides today, so a screen moved to these kinds behaves the same.

- `accountStatus`, no query, `AccountStatus`:
  - `exists`: ever used, a transaction or a balance of any asset: the legacy scan's `Account.used`, what account discovery stops on.
  - `accountGate`, null when none:
    - `{ type: "onboarding" }`: Canton and Concordium while `isOnboarded` is false, as their add-account and onboard flows decide. It can neither receive nor send.
    - `{ type: "activation", reason }`: `Account.readiness` not ready (Tezos `unrevealed`, Sei `activationRequired`), as Perps `getReadinessError` decides. It receives, but cannot send yet.
- `assetStatus`, query `{ assetId }` (a token of the account's network or its native coin), result `{ assetId, status }`, `AssetStatus`:
  - `assetGate`, null when there is no gate, always for the native coin and for a family without activation:
    - `{ type: "activation", method }`:
      - `association`: Hedera's `isTokenAssociationRequired`, the receive-with-association condition.
      - `optIn` (Algorand) and `trustline` (Stellar): no token account for it, as the opt-in and add-asset selectors decide.
      - `trustline` (XRP IOU) or `authorize` (XRP MPT): no token account with `xrpResources`, as the add-token `filterTokenOptions` decides.
    - `{ type: "unknown" }`: an XRP token of a standard sync does not read.
  - Known gaps, kept for compatibility until the coin module `getAssetStatus`: a hidden token has no token account, so it answers activation; a generic sync keeps a removed Stellar trustline as a token account, so it answers none; Hedera counts only unlimited automatic association.
  - A token of another network is an error, not a gate.
- The slice keys each `AccountUUID` to `{ account?, assets }`, each entry with its own revision, the older answer never replacing the newer. `assets` fills one asset read at a time.
- `receiveGate(account, asset?)` stops on onboarding, then on the asset gate. `sendGate(account)` stops on the account gate.
- `selectAccountStatus(state, accountUUID)` and `selectAssetStatus(state, accountUUID, assetId)`. Apps mount the slice at `accountStatus`.

Not a fetch status: pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-models/data-layer.md).
