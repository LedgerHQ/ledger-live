# Aleo staking flow — unify `Body.tsx` (SELF-REVIEW finding #4)

**Ticket:** LIVE-29195
**Scope:** `apps/ledger-live-desktop/src/renderer/families/aleo/`
**Status:** approved design, ready for implementation plan

## Problem

The three Aleo staking flow modals each ship a near-identical `Body.tsx`:

- `BondPublicFlowModal/Body.tsx` — 194 lines
- `UnbondFlowModal/Body.tsx` — 167 lines
- `ClaimUnbondFlowModal/Body.tsx` — 167 lines

They are ~90% byte-identical. This PR already de-duplicated the sibling files
via factories in `shared/` — `createStakingFlowModal.tsx` (for the `index.tsx`
wrappers) and `createStepConfirmation.tsx` (for `StepConfirmation`) — but the
largest duplicated chunk, `Body.tsx`, was left un-refactored. The refactor is
half-done; this spec finishes it using the same established pattern.

## What actually varies per flow

| Concern | Bond | Unbond | Claim |
|---|---|---|---|
| `steps` array (flow-specific step components + i18n keys) | 5 steps | 3 steps | 3 steps |
| initial tx `mode` | `bond_public` | `unbond_public` | `claim_unbond_public` |
| initial tx `recipient` | `""` | `mainAccount.freshAddress` | `mainAccount.freshAddress` |
| initial tx `withdrawal` | `mainAccount.freshAddress` | — | — |
| initial step id | `validator` | `amount` | `summary` |
| title i18n key | `aleo.bond.flow.title` | `aleo.unbond.flow.title` | `aleo.claim.flow.title` |
| Track close event | `CloseModalBondPublic` | `CloseModalUnbond` | `CloseModalClaimUnbond` |

Everything else is identical: the `connect`/`withTranslation` HOC, the
`optimisticOperation`/`transactionError`/`signed` state, `useAccountBridge` +
`useBridgeTransaction`, the `handleStepChange`/`handleRetry`/
`handleTransactionError`/`handleOperationBroadcasted` handlers, the
`error`/`errorSteps` computation, the full `stepperProps` object, and the
`<Stepper>` render with `SyncSkipUnderPriority` + `Track`.

Two values that look flow-specific are actually derivable and become zero config:

- `errorSteps` confirmation index (hardcoded `2` for unbond/claim, `4` for
  bond) = `steps.length - 1` for the `confirmation` step, `steps.length - 2`
  otherwise.
- `handleRetry` target and the `hideBreadcrumb` first-step check both reference
  the flow's initial step id, so a single `initialStepId` config drives both.

## Design

Add a third factory alongside the two existing ones:

`apps/ledger-live-desktop/src/renderer/families/aleo/shared/createStakingFlowBody.tsx`

It owns all the shared logic and returns the composed, connected component that
each flow's `index.tsx` renders (via `createStakingFlowModal`).

### Factory signature (declarative config)

```ts
export function createStakingFlowBody<StepId extends string>({
  steps,
  initialStepId,
  title,
  trackCloseEvent,
  mode,
  recipientFromFresh,
  withdrawalFromFresh,
}: {
  steps: Array<St>;
  initialStepId: StepId;
  title: string;                 // i18n key
  trackCloseEvent: string;       // segment event name
  mode: Transaction["mode"];
  recipientFromFresh?: boolean;  // true → mainAccount.freshAddress, else ""
  withdrawalFromFresh?: boolean; // true → adds withdrawal: mainAccount.freshAddress
}): React.ComponentType<OwnProps<StepId>>;
```

### Initial-transaction construction (inside the factory)

```ts
const mainAccount = getMainAccount(account, parentAccount);
const t0 = bridge.createTransaction(account);
const patch: Partial<Transaction> = {
  mode,
  recipient: recipientFromFresh ? mainAccount.freshAddress : "",
};
if (withdrawalFromFresh) patch.withdrawal = mainAccount.freshAddress;
const transaction = bridge.updateTransaction(t0, patch);
```

### Shared types

`OwnProps`, `StateProps`, and the `Data` type currently live (identically) in
each `Body.tsx`. They move into the factory module. The per-flow `types.ts`
files (which define each flow's `StepId` union, `St`, `StepProps`) stay as-is;
the factory is generic over `StepId`. `St`/`StepProps` are structurally
identical across flows, so the factory uses those shared shapes.

> Note: `Data` is currently re-exported from each `Body.tsx` (`export type Data`).
> Confirm during implementation whether any external module imports
> `.../Body`'s `Data`; if so, keep a re-export from each `Body.tsx` so no
> import path breaks. `ModalData` typing already flows through
> `createStakingFlowModal`, so this is expected to be internal-only.

### Per-flow `Body.tsx` after refactor (~20 lines each)

Each file builds its own `steps` array (unavoidable — it imports that flow's
step components and i18n keys) and delegates:

```ts
// BondPublicFlowModal/Body.tsx
import { createStakingFlowBody } from "../shared/createStakingFlowBody";
import { StepId, St, StepProps } from "./types";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
// ...other step imports...

const steps: Array<St> = [ /* 5 steps, unchanged */ ];

export default createStakingFlowBody<StepId>({
  steps,
  initialStepId: "validator",
  title: "aleo.bond.flow.title",
  trackCloseEvent: "CloseModalBondPublic",
  mode: "bond_public",
  recipientFromFresh: false,
  withdrawalFromFresh: true,
});
```

Unbond: `initialStepId: "amount"`, `title: "aleo.unbond.flow.title"`,
`trackCloseEvent: "CloseModalUnbond"`, `mode: "unbond_public"`,
`recipientFromFresh: true`.

Claim: `initialStepId: "summary"`, `title: "aleo.claim.flow.title"`,
`trackCloseEvent: "CloseModalClaimUnbond"`, `mode: "claim_unbond_public"`,
`recipientFromFresh: true`.

## Behavior contract

Zero runtime change. For each flow the factory must produce a `stepperProps`
object byte-identical to today's, and the same `<Stepper>` children
(`SyncSkipUnderPriority priority={100}` + `Track onUnmount event={...}`).

## Verification

- `pnpm typecheck` (or the desktop-scoped equivalent) is clean.
- No existing Body-level unit tests to update (confirmed: only
  `AccountBalanceSummaryFooter`, `AccountHeaderManageActions`, and `shared/*`
  have tests). A build/typecheck plus manual confirmation that each of the three
  modals still mounts and steps through is sufficient.
- Diff review: the deleted per-flow logic must map 1:1 onto the factory.

## Non-goals

- No behavioral change, no new tests beyond typecheck.
- Does not touch the other SELF-REVIEW findings (#1–3, #5–7).
- Does not alter step components, `types.ts`, or i18n keys.

## Net effect

~528 lines across three `Body.tsx` files → one ~130-line factory + three
~20-line config files, consistent with the two factories already in `shared/`.
