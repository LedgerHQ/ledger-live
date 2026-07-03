# Aleo Staking `Body.tsx` Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the three near-identical Aleo staking flow `Body.tsx` files into one shared `createStakingFlowBody` factory, leaving each flow with a ~20-line declarative config.

**Architecture:** Add a factory in `shared/` mirroring the two factories this PR already introduced (`createStakingFlowModal`, `createStepConfirmation`). The factory owns all shared logic (HOC, state, bridge wiring, handlers, error computation, `stepperProps`, `<Stepper>` render). Each `Body.tsx` builds its own flow-specific `steps` array (it must import that flow's step components + i18n keys) and calls the factory with declarative config.

**Tech Stack:** React, TypeScript, redux `connect` + `react-i18next` `withTranslation`, `@ledgerhq/live-common` bridge hooks.

## Global Constraints

- **DO NOT COMMIT.** Leave all changes in the working tree; the user reviews and commits. No `git commit`, `git add -A && commit`, no PR.
- Zero runtime behavior change. For each flow the resulting `stepperProps` object and `<Stepper>` children must be identical to the pre-refactor version.
- Follow the established `shared/` factory pattern exactly (see `shared/createStakingFlowModal.tsx` and `shared/StepConfirmation.tsx`).
- Every `Body.tsx` MUST keep `export type Data` — `apps/ledger-live-desktop/src/renderer/families/modals-loaders.ts` imports `type Data` from each flow's `./Body` (lines 4, 6, 7). Breaking these import paths breaks the build.
- Verification is `pnpm typecheck` run from `apps/ledger-live-desktop/`. There are no Body-level unit tests to add (only `AccountBalanceSummaryFooter`, `AccountHeaderManageActions`, and `shared/*` have tests).
- Do not touch step components, per-flow `types.ts`, i18n keys, or any other SELF-REVIEW finding.

---

### Task 1: Create the shared `createStakingFlowBody` factory

**Files:**
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/shared/createStakingFlowBody.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks. Uses `Transaction`, `AleoAccount` from `@ledgerhq/live-common/families/aleo/types`; `Step` shape via each flow's `St` type passed in.
- Produces:
  - `export type StakingFlowData` — `{ account: AleoAccount; parentAccount?: Account; source?: string }` (the shared shape each flow re-exports as `Data`).
  - `export type StakingFlowBodyOwnProps<StepId>` — `{ stepId: StepId; onClose: () => void; onChangeStepId: (a: StepId) => void; params: StakingFlowData }`.
  - `export function createStakingFlowBody<StepId extends string>(config): React.ComponentType<StakingFlowBodyOwnProps<StepId>>` where `config` is:
    ```ts
    {
      steps: Array<Step<StepId, StakingStepProps>>;
      initialStepId: StepId;
      title: string;              // i18n key
      trackCloseEvent: string;    // segment event name
      mode: Transaction["mode"];
      recipientFromFresh?: boolean;
      withdrawalFromFresh?: boolean;
    }
    ```
  - `export type StakingStepProps` — the shared step-props shape (identical across the three per-flow `StepProps`), so the factory can type `steps` generically.

- [ ] **Step 1: Write the factory file**

This is a faithful lift of the shared logic from the three existing `Body.tsx` files. Create `apps/ledger-live-desktop/src/renderer/families/aleo/shared/createStakingFlowBody.tsx`:

```tsx
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Stepper, { Step } from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import { AleoAccount, Transaction, TransactionStatus } from "@ledgerhq/live-common/families/aleo/types";
import { Account, Operation } from "@ledgerhq/types-live";

// Shared between BondPublicFlowModal / UnbondFlowModal / ClaimUnbondFlowModal:
// the three Body.tsx files were ~90% byte-identical, differing only by the
// steps array, the initial transaction patch, the initial step id, the title
// key and the close-tracking event. This factory captures the shared shell,
// matching the createStakingFlowModal / createStepConfirmation factories.

export type StakingFlowData = {
  account: AleoAccount;
  parentAccount?: Account;
  source?: string;
};

// Structurally identical to each flow's StepProps in its types.ts.
export type StakingStepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: Account | undefined | null;
  parentAccount: Account | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  source?: string;
};

export type StakingFlowBodyOwnProps<StepId extends string> = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: StakingFlowData;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  openModal: OpenModal;
};

type StakingFlowBodyConfig<StepId extends string> = {
  steps: Array<Step<StepId, StakingStepProps>>;
  initialStepId: StepId;
  title: string;
  trackCloseEvent: string;
  mode: Transaction["mode"];
  recipientFromFresh?: boolean;
  withdrawalFromFresh?: boolean;
};

export function createStakingFlowBody<StepId extends string>({
  steps,
  initialStepId,
  title,
  trackCloseEvent,
  mode,
  recipientFromFresh,
  withdrawalFromFresh,
}: StakingFlowBodyConfig<StepId>) {
  type Props = StakingFlowBodyOwnProps<StepId> & StateProps;

  const confirmationIndex = steps.length - 1;
  const connectDeviceIndex = steps.length - 2;

  const mapStateToProps = createStructuredSelector({ device: getCurrentDevice });
  const mapDispatchToProps = { openModal };

  const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
    const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
    const [transactionError, setTransactionError] = useState<Error | null>(null);
    const [signed, setSigned] = useState(false);
    const dispatch = useDispatch();
    const { account, parentAccount, source = "Account Page" } = params;
    const bridge = useAccountBridge<Transaction>(account, parentAccount);

    const { transaction, setTransaction, updateTransaction, status, bridgeError, bridgePending } =
      useBridgeTransaction<Transaction>(bridge, () => {
        const mainAccount = getMainAccount(account, parentAccount);
        const t0 = bridge.createTransaction(account);
        const patch: Partial<Transaction> = {
          mode,
          recipient: recipientFromFresh ? mainAccount.freshAddress : "",
        };
        if (withdrawalFromFresh) patch.withdrawal = mainAccount.freshAddress;
        const transaction = bridge.updateTransaction(t0, patch);
        return { account, parentAccount, transaction };
      });

    const handleStepChange = useCallback(
      (e: Step<StepId, StakingStepProps>) => onChangeStepId(e.id),
      [onChangeStepId],
    );
    const handleRetry = useCallback(() => {
      setTransactionError(null);
      onChangeStepId(initialStepId);
    }, [onChangeStepId]);
    const handleTransactionError = useCallback((error: Error) => {
      if (!(error instanceof UserRefusedOnDevice)) {
        logger.critical(error);
      }
      setTransactionError(error);
    }, []);
    const handleOperationBroadcasted = useCallback(
      (optimisticOperation: Operation) => {
        if (!account) return;
        dispatch(
          updateAccountWithUpdater(account.id, account =>
            addPendingOperation(account, optimisticOperation),
          ),
        );
        setOptimisticOperation(optimisticOperation);
        setTransactionError(null);
      },
      [account, dispatch],
    );

    const error = transactionError || bridgeError;
    const errorSteps: number[] = [];
    if (transactionError) {
      errorSteps.push(stepId === steps[confirmationIndex].id ? confirmationIndex : connectDeviceIndex);
    } else if (bridgeError) {
      errorSteps.push(0);
    }

    const stepperProps = {
      title: t(title),
      device,
      account,
      parentAccount,
      transaction,
      signed,
      stepId,
      steps,
      errorSteps,
      disabledSteps: [],
      hideBreadcrumb: !!error && stepId === initialStepId,
      onRetry: handleRetry,
      onStepChange: handleStepChange,
      onClose,
      error,
      status,
      optimisticOperation,
      openModal,
      setSigned,
      onChangeTransaction: setTransaction,
      onUpdateTransaction: updateTransaction,
      onOperationBroadcasted: handleOperationBroadcasted,
      onTransactionError: handleTransactionError,
      t,
      bridgePending,
      source,
    };

    return (
      <Stepper {...stepperProps}>
        <SyncSkipUnderPriority priority={100} />
        <Track onUnmount event={trackCloseEvent} />
      </Stepper>
    );
  };

  return compose<React.ComponentType<StakingFlowBodyOwnProps<StepId>>>(
    connect(mapStateToProps, mapDispatchToProps),
    withTranslation(),
  )(Body);
}
```

Notes on faithful-lift decisions:
- `hideBreadcrumb`: original was `!!error && ["amount"].includes(stepId)` where the single element is always the flow's first/initial step. `stepId === initialStepId` is equivalent.
- `errorSteps`: original hardcoded `2`/`4` for confirmation and `1`/`3` for the other error step. `confirmationIndex = steps.length - 1` and `connectDeviceIndex = steps.length - 2` reproduce both (bond: 5 steps → 4/3; unbond & claim: 3 steps → 2/1). The `stepId === steps[confirmationIndex].id` check matches the original `stepId === "confirmation"`.
- `Step` is imported from `~/renderer/components/Stepper` — the same type each flow's `types.ts` builds `St` from (`export type St = Step<StepId, StepProps>`).

- [ ] **Step 2: Typecheck the new file compiles**

Run (from `apps/ledger-live-desktop/`):
```bash
pnpm typecheck
```
Expected: no NEW errors referencing `shared/createStakingFlowBody.tsx`. (The three per-flow `Body.tsx` are still unchanged and independently valid at this point, so the whole app should still typecheck clean.)

- [ ] **Step 3: Do NOT commit**

Per Global Constraints, leave changes in the working tree.

---

### Task 2: Refactor `BondPublicFlowModal/Body.tsx`

**Files:**
- Modify: `apps/ledger-live-desktop/src/renderer/families/aleo/BondPublicFlowModal/Body.tsx` (replace whole file)

**Interfaces:**
- Consumes: `createStakingFlowBody`, `StakingFlowData` from `../shared/createStakingFlowBody` (Task 1). `StepId` from `./types`. Existing step components under `./steps/`.
- Produces: default export unchanged (a `React.ComponentType` consumed by `./index.tsx`); `export type Data` unchanged (consumed by `modals-loaders.ts`).

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `BondPublicFlowModal/Body.tsx` with:

```tsx
import React from "react";
import { Trans } from "react-i18next";
import { StepId, StepProps, St } from "./types";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
import StepWithdrawal, { StepWithdrawalFooter } from "./steps/StepWithdrawal";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { createStakingFlowBody, StakingFlowData } from "../shared/createStakingFlowBody";

export type Data = StakingFlowData;

const steps: Array<St> = [
  {
    id: "validator",
    label: <Trans i18nKey="aleo.bond.flow.steps.validator.title" />,
    component: StepValidator,
    noScroll: true,
    footer: StepValidatorFooter,
  },
  {
    id: "withdrawal",
    label: <Trans i18nKey="aleo.bond.flow.steps.withdrawal.title" />,
    component: StepWithdrawal,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
    noScroll: true,
    footer: StepWithdrawalFooter,
  },
  {
    id: "amount",
    label: <Trans i18nKey="aleo.bond.flow.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("withdrawal"),
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="aleo.bond.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="aleo.bond.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

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

- [ ] **Step 2: Typecheck**

Run (from `apps/ledger-live-desktop/`):
```bash
pnpm typecheck
```
Expected: clean. If `steps: Array<St>` errors because the factory expects `Step<StepId, StakingStepProps>`, this confirms `St` (`Step<StepId, StepProps>`) and `Step<StepId, StakingStepProps>` are compatible — they should be, since `StepProps` and `StakingStepProps` are structurally identical. If a mismatch surfaces, reconcile by having the factory accept `Array<St>`-compatible input (widen the `steps` generic), NOT by changing behavior.

- [ ] **Step 3: Do NOT commit**

---

### Task 3: Refactor `UnbondFlowModal/Body.tsx`

**Files:**
- Modify: `apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal/Body.tsx` (replace whole file)

**Interfaces:**
- Consumes: `createStakingFlowBody`, `StakingFlowData` from `../shared/createStakingFlowBody`; `StepId` from `./types`; `./steps/StepAmount`, `./steps/StepConfirmation`.
- Produces: default export + `export type Data`, both unchanged in shape.

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `UnbondFlowModal/Body.tsx` with:

```tsx
import React from "react";
import { Trans } from "react-i18next";
import { StepId, StepProps, St } from "./types";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { createStakingFlowBody, StakingFlowData } from "../shared/createStakingFlowBody";

export type Data = StakingFlowData;

const steps: Array<St> = [
  {
    id: "amount",
    label: <Trans i18nKey="aleo.unbond.flow.steps.amount.title" />,
    component: StepAmount,
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="aleo.unbond.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="aleo.unbond.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

export default createStakingFlowBody<StepId>({
  steps,
  initialStepId: "amount",
  title: "aleo.unbond.flow.title",
  trackCloseEvent: "CloseModalUnbond",
  mode: "unbond_public",
  recipientFromFresh: true,
});
```

- [ ] **Step 2: Typecheck**

Run (from `apps/ledger-live-desktop/`):
```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 3: Do NOT commit**

---

### Task 4: Refactor `ClaimUnbondFlowModal/Body.tsx`

**Files:**
- Modify: `apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal/Body.tsx` (replace whole file)

**Interfaces:**
- Consumes: `createStakingFlowBody`, `StakingFlowData` from `../shared/createStakingFlowBody`; `StepId` from `./types`; `./steps/StepSummary`, `./steps/StepConfirmation`.
- Produces: default export + `export type Data`, both unchanged in shape.

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `ClaimUnbondFlowModal/Body.tsx` with:

```tsx
import React from "react";
import { Trans } from "react-i18next";
import { StepId, StepProps, St } from "./types";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { createStakingFlowBody, StakingFlowData } from "../shared/createStakingFlowBody";

export type Data = StakingFlowData;

const steps: Array<St> = [
  {
    id: "summary",
    label: <Trans i18nKey="aleo.claim.flow.steps.summary.title" />,
    component: StepSummary,
    noScroll: true,
    footer: StepSummaryFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="aleo.claim.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("summary"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="aleo.claim.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

export default createStakingFlowBody<StepId>({
  steps,
  initialStepId: "summary",
  title: "aleo.claim.flow.title",
  trackCloseEvent: "CloseModalClaimUnbond",
  mode: "claim_unbond_public",
  recipientFromFresh: true,
});
```

- [ ] **Step 2: Typecheck**

Run (from `apps/ledger-live-desktop/`):
```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 3: Do NOT commit**

---

### Task 5: Full verification

**Files:** none modified.

**Interfaces:** none.

- [ ] **Step 1: Confirm the `Data` re-exports still resolve**

Verify `modals-loaders.ts` still imports each flow's `Data` without error:
```bash
grep -n "aleo/.*FlowModal/Body" apps/ledger-live-desktop/src/renderer/families/modals-loaders.ts
```
Expected: the three Aleo lines (BondPublic, Unbond, ClaimUnbond) still present. The `export type Data = StakingFlowData` line in each refactored `Body.tsx` keeps these paths valid.

- [ ] **Step 2: Full desktop typecheck**

Run (from `apps/ledger-live-desktop/`):
```bash
pnpm typecheck
```
Expected: PASS with no errors in `families/aleo/`.

- [ ] **Step 3: Confirm line-count reduction**

```bash
wc -l apps/ledger-live-desktop/src/renderer/families/aleo/shared/createStakingFlowBody.tsx \
      apps/ledger-live-desktop/src/renderer/families/aleo/BondPublicFlowModal/Body.tsx \
      apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal/Body.tsx \
      apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal/Body.tsx
```
Expected: one ~180-line factory + three ~55-line configs, down from 194/167/167.

- [ ] **Step 4: Diff review**

Run:
```bash
git diff --stat apps/ledger-live-desktop/src/renderer/families/aleo/
```
Confirm the three `Body.tsx` shrank and the factory was added. Manually confirm the deleted per-flow logic maps 1:1 onto the factory (no dropped `stepperProps` field, same `<Stepper>` children, same Track event names).

- [ ] **Step 5: Do NOT commit — hand back to user**

Report the changed files and typecheck result. The user reviews and commits.

---

## Self-Review

**1. Spec coverage:**
- Factory in `shared/createStakingFlowBody.tsx` → Task 1. ✓
- Declarative config (`mode`/`recipientFromFresh`/`withdrawalFromFresh`) → Task 1 Step 1 + used in Tasks 2–4. ✓
- Derived `errorSteps` and `hideBreadcrumb` from `steps`/`initialStepId` → Task 1 Step 1 (with equivalence notes). ✓
- Each `Body.tsx` reduced to config → Tasks 2–4. ✓
- `export type Data` preserved for `modals-loaders.ts` → Tasks 2–4 Step 1 + Task 5 Step 1. ✓ (This was flagged as a "confirm" item in the spec; grep confirmed three real importers, so it is now a hard constraint.)
- Zero behavior change + typecheck verification → every task's typecheck step + Task 5. ✓
- Non-goals (no test/step-component/i18n changes) → respected; no such tasks. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". All step code is complete and repeated per task. ✓

**3. Type consistency:** `createStakingFlowBody`, `StakingFlowData`, `StakingFlowBodyOwnProps`, `StakingStepProps` used identically in Task 1 (definition) and Tasks 2–4 (`StakingFlowData` import). `steps: Array<St>` where `St = Step<StepId, StepProps>`; factory types `steps` as `Step<StepId, StakingStepProps>` — Task 2 Step 2 explicitly calls out reconciling if the structural-identity assumption fails. `mode` literals (`"bond_public"`/`"unbond_public"`/`"claim_unbond_public"`) match the originals verbatim. ✓
