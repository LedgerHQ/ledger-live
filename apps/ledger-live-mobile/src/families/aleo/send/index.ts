import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { AleoRecipientScreen } from "./screens/RecipientScreen";
import { AleoAmountScreen } from "./screens/AmountScreen";

/**
 * Aleo-specific step registry for the Send flow.
 * Overrides the Recipient and Amount steps to add Aleo-specific UI:
 * - Recipient: Adds balance selector (public/private toggle) and self-transfer button
 * - Amount: Adds info banner for private transfers about record selection
 */
export const aleoSendStepRegistry: Partial<StepRegistry<SendFlowStep>> = {
  [SEND_FLOW_STEP.RECIPIENT]: AleoRecipientScreen,
  [SEND_FLOW_STEP.AMOUNT]: AleoAmountScreen,
};

// Export components for direct use if needed
export { AleoRecipientScreen, AleoAmountScreen };
export { BalanceSelector } from "./components/BalanceSelector";
export * from "./utils";
