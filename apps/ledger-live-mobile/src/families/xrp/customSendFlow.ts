import type { CustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";
import { SendAmountFooterRow } from "./Send/SendAmountFooterRow";

const xrpSendFlow = {
  screens: [],
  AmountFooterRow: SendAmountFooterRow,
} satisfies CustomSendFlow;

export default xrpSendFlow;
