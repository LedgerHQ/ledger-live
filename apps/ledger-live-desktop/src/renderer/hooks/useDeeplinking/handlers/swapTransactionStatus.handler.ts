import { parseSwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import { openModal } from "~/renderer/actions/modals";
import { DeeplinkHandler } from "../types";

export const swapTransactionStatusHandler: DeeplinkHandler<"transaction-status"> = (
  route,
  { dispatch },
) => {
  const result = parseSwapTransactionStatusParams(route);
  if (!result.ok) return;
  dispatch(openModal("MODAL_SWAP_TRANSACTION_STATUS", result.params));
};
