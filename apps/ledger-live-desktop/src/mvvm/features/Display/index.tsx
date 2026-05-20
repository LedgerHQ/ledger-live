import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { DISPLAY_FLOW_STEP, type DisplayFlowStep } from "@ledgerhq/live-common/flows/display/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import { DisplayFlowOrchestrator } from "./DisplayFlowOrchestrator";
import { DisplayFlowLayout } from "./components/DisplayFlowLayout";
import { BalanceScreen } from "./screens/BalanceScreen";
import { TransactionsScreen } from "./screens/TransactionsScreen";
import { TokensScreen } from "./screens/TokensScreen";

/**
 * Step registry — maps every step id to the React component that renders it.
 *
 * The Display flow config lives in `./constants.ts` (which steps exist);
 * this map says HOW each step is rendered. Keeping the two separate lets the
 * FlowWizard navigation stay 100% generic.
 */
const stepRegistry: StepRegistry<DisplayFlowStep> = {
  [DISPLAY_FLOW_STEP.BALANCE]: BalanceScreen,
  [DISPLAY_FLOW_STEP.TRANSACTIONS]: TransactionsScreen,
  [DISPLAY_FLOW_STEP.TOKENS]: TokensScreen,
};

type DisplayWorkflowParams = Readonly<{
  account?: AccountLike;
  parentAccount?: Account;
}>;

type DisplayWorkflowProps = Readonly<{
  onClose: () => void;
  params?: DisplayWorkflowParams;
  isOpen: boolean;
}>;

/**
 * Top-level workflow wrapper consumed by `DisplayFlowRoot`.
 * Mirrors `SendWorkflow` but with a minimal surface (no init params besides the account).
 */
export function DisplayWorkflow({ onClose, params, isOpen }: DisplayWorkflowProps) {
  return (
    <DisplayFlowOrchestrator
      account={params?.account}
      parentAccount={params?.parentAccount}
      onClose={onClose}
      stepRegistry={stepRegistry}
    >
      <DisplayFlowLayout isOpen={isOpen} onClose={onClose} />
    </DisplayFlowOrchestrator>
  );
}
