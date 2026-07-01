# Aleo Unstake & Claim Flows — Design

**Date:** 2026-06-29
**Branch context:** `wip/bd/LIVE-29195`
**Scope:** Full vertical slice (coin module + LLD UI), **desktop only**, **without staking-balance data**.

## Goal

Add two new Aleo staking operations to Ledger Live Desktop, mirroring the existing
`bond_public` (Stake) slice:

- **Unstake** → on-chain `unbond_public(staker, amount)`
- **Claim** → on-chain `claim_unbond_public(staker)`

Reached through a new **Manage** hub modal (Celo-style), alongside the existing
`BondPublicFlowModal`.

## Out of scope (explicit)

- **Staking-balance data** (bonded total, pending-unbond record, claimable height). No
  changes to `AleoResources` / sync. As a consequence:
  - Unstake uses a **free amount input** (`amount > 0` only); **no Max button**, no
    `amount ≤ bonded` ceiling, no min-bond remainder check (the chain rejects invalid
    unbonds).
  - The Manage hub shows **Stake / Unstake / Claim all always enabled** (no gating).
  - The Claim flow submits `claim_unbond_public(staker)` with **no claimable amount
    displayed**.
  - Wiring Max / gating / claimable display is left as **TODOs** for when staking data
    lands (separate ticket).
- **ledger-live-mobile** — desktop only for this plan.

## Architecture

Celo-style: one hub modal that branches to separate, self-contained per-action flow
modals.

```
apps/ledger-live-desktop/src/renderer/families/aleo/
  ManageModal/                 ← NEW hub: Stake / Unstake / Claim
  BondPublicFlowModal/         (exists — unchanged except reachable via hub)
  UnbondFlowModal/             ← NEW
    index.tsx
    Body.tsx
    types.ts
    steps/
      StepAmount.tsx
      StepConfirmation.tsx
  ClaimUnbondFlowModal/        ← NEW
    index.tsx
    Body.tsx
    types.ts
    steps/
      StepSummary.tsx
      StepConfirmation.tsx
```

New modal ids: `MODAL_ALEO_MANAGE`, `MODAL_ALEO_UNBOND`, `MODAL_ALEO_CLAIM_UNBOND`.

Both flows reuse `~/renderer/modals/Send/steps/GenericStepConnectDevice` for the device
step, exactly as `BondPublicFlowModal` does.

## Coin-module changes (`libs/coin-modules/coin-aleo`)

Add `UNBOND_PUBLIC` and `CLAIM_UNBOND_PUBLIC` to `TRANSACTION_TYPE` and thread them
through every place `bond_public` is handled:

| File | Change |
|---|---|
| `src/constants.ts` | add `UNBOND_PUBLIC: "unbond_public"`, `CLAIM_UNBOND_PUBLIC: "claim_unbond_public"` to `TRANSACTION_TYPE` |
| `src/types/bridge.ts` | add `Transaction` + `TransactionRaw` variants: unbond carries the amount (existing `amount` field, no extra props); claim has `properties?: never` |
| `src/types/sdk.ts` | add intent `type: "unbond_public"` / `"claim_unbond_public"` |
| `src/types/logic.ts` | add corresponding intent `type` entries |
| `src/logic/utils.ts` | extend the mode switches: intent mapping (`buildTransactionIntent`-style), function-name mapping (returns `"unbond_public"` / `"claim_unbond_public"`), and `derivePublicTransactionMode` |
| `src/bridge/transaction.ts` | raw↔tx serialization (`fromTransactionRaw` / `toTransactionRaw`) for the new variants |
| `src/bridge/prepareTransaction.ts` | amount/fee preparation for the new modes (unbond uses the input amount; claim has no amount) |
| `src/bridge/getTransactionStatus.ts` | unstake: validate `amount > 0` (no bonded ceiling — see out-of-scope); claim: no amount validation |
| `src/deviceTransactionConfig.ts` | device labels: `"Unbond Public"`, `"Claim Unbond Public"` |

No new fields on `AleoResources`.

## UI flows

### ManageModal (hub)
- Registered as `MODAL_ALEO_MANAGE`.
- Layout mirrors `families/celo/ManageModal/ManageModal.tsx`: a list of actions.
- Actions: **Stake** → `MODAL_ALEO_BOND_PUBLIC`, **Unstake** → `MODAL_ALEO_UNBOND`,
  **Claim** → `MODAL_ALEO_CLAIM_UNBOND`. All always enabled.
- `AccountHeaderManageActions.tsx`: replace the current "Stake" header button so it opens
  `MODAL_ALEO_MANAGE` instead of `MODAL_ALEO_BOND_PUBLIC` directly. (Self-transfer button
  unchanged.)

### UnbondFlowModal
- `Body.tsx` mirrors `BondPublicFlowModal/Body.tsx`, seeding the bridge transaction with
  `mode: "unbond_public"`.
- Steps: `amount` → `connectDevice` → `confirmation`.
- `StepAmount.tsx`: plain amount input, validation `amount > 0`. **No Max button.** TODO
  comment to add Max + bonded ceiling when staking data is available.

### ClaimUnbondFlowModal
- `Body.tsx` seeds `mode: "claim_unbond_public"` (no amount).
- Steps: `summary` (read-only confirmation text, no claimable amount) → `connectDevice` →
  `confirmation`.

## Registration touch-points

- `apps/ledger-live-desktop/src/renderer/families/aleo/constants.ts`: add the three new
  ids to the `AleoCustomModal` enum.
- `apps/ledger-live-desktop/src/renderer/families/modals-loaders.ts`: add data-type
  imports and dynamic-import entries for the three new modals.
- `apps/ledger-live-desktop/src/renderer/families/aleo/index.ts`: add the three ids to
  `modalsToPreload`.

## i18n & changeset

- `apps/ledger-live-desktop/static/i18n/en/app.json`: add `aleo.manage.*`, `aleo.unbond.*`,
  and `aleo.claim.*` trees (titles, step labels, button labels, info/summary text).
- Add a changeset documenting the new Aleo unstake/claim flows.

## Testing

- `coin-aleo` unit tests, extended in parallel with existing `bond_public` coverage:
  - `bridge/getTransactionStatus.test.ts`: unstake `amount > 0` validation; claim path.
  - `logic/utils.test.ts`: intent mapping + function-name mapping for both new modes.
  - `bridge/transaction.test.ts`: raw↔tx serialization round-trips for both new variants.
- LLD:
  - `AccountHeaderManageActions.test.tsx`: header button now opens `MODAL_ALEO_MANAGE`.
  - New ManageModal test: renders three actions, each dispatches the right `openModal`.

## Build sequence

1. Coin module: constants → types → logic/utils → bridge (transaction, prepare, status) →
   deviceTransactionConfig, with tests alongside.
2. Rebuild `coin-aleo` + `ledger-live-common` so LLD picks up the new types.
3. LLD: constants enum → modals-loaders + index registration → ManageModal →
   UnbondFlowModal → ClaimUnbondFlowModal → AccountHeaderManageActions rewire.
4. i18n + changeset.
5. Tests + typecheck.
