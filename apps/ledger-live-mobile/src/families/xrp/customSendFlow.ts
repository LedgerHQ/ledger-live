import type { CustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";
import AfterAmountInput from "./AfterAmountInput";

// XRP only needs the amount-step slot; see AfterAmountInput (LIVE-35403).
const xrpSendFlow = {
  screens: [],
  AfterAmountInput,
} satisfies CustomSendFlow;

export default xrpSendFlow;
