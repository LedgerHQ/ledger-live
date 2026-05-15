import React, { useMemo, type ReactNode } from "react";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDisplayUiConfig } from "@ledgerhq/live-common/flows/display/uiConfig";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  DisplayFlowStep,
  DisplayFlowUiConfig,
} from "@ledgerhq/live-common/flows/display/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import { FlowWizardOrchestrator } from "../FlowWizard/FlowWizardOrchestrator";
import { DISPLAY_FLOW_CONFIG } from "./constants";
import { DisplayFlowProvider } from "./context/DisplayFlowContext";
import type { DisplayFlowBusinessContext, DisplayStepConfig } from "./types";

type DisplayFlowOrchestratorProps = Readonly<{
  account?: AccountLike;
  parentAccount?: Account;
  onClose: () => void;
  stepRegistry: StepRegistry<DisplayFlowStep>;
  children?: ReactNode;
}>;

/**
 * DisplayFlowOrchestrator
 *
 * Assembly point of the Display POC.
 *
 * Top-to-bottom chain (mirrors the SendFlow chain):
 *   Coin Descriptor
 *     -> Display UI Config (live-common)
 *       -> Display Business Context (LLD)
 *         -> FlowWizard Orchestrator
 *           -> Display Flow Layout (children)
 *             -> Display Screen
 *
 * It does not render any step itself — only wires the FlowWizard navigation
 * engine with the descriptor-driven business context.
 */
export function DisplayFlowOrchestrator({
  account,
  parentAccount,
  onClose,
  stepRegistry,
  children,
}: DisplayFlowOrchestratorProps) {
  const businessContext = useMemo<DisplayFlowBusinessContext>(() => {
    const mainAccount = account ? getMainAccount(account, parentAccount ?? null) : null;
    const currency = account ? getAccountCurrency(account) : null;
    // The descriptor reads real data from the account (balance, operations,
    // sub-accounts). Passing the AccountLike directly lets each family format
    // numbers with its own unit without any branching here.
    const uiConfig: DisplayFlowUiConfig = getDisplayUiConfig(account);

    return {
      account: account ?? null,
      parentAccount: mainAccount && parentAccount ? parentAccount : null,
      currency,
      uiConfig,
      close: onClose,
    };
  }, [account, parentAccount, onClose]);

  return (
    <FlowWizardOrchestrator<DisplayFlowStep, DisplayFlowBusinessContext, DisplayStepConfig>
      flowConfig={DISPLAY_FLOW_CONFIG}
      stepRegistry={stepRegistry}
      contextValue={businessContext}
      ContextProvider={DisplayFlowProvider}
    >
      {children}
    </FlowWizardOrchestrator>
  );
}
