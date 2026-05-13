import { parseSwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import { openSwapTransactionStatusDialog } from "~/renderer/reducers/swapTransactionStatusDialog";
import { DeeplinkHandler } from "../types";

export const swapTransactionStatusHandler: DeeplinkHandler<"swap-transaction-status"> = (
  route,
  { dispatch },
) => {
  const result = parseSwapTransactionStatusParams(route);
  if (!result.ok) return;
  dispatch(openSwapTransactionStatusDialog(result.params));
};
