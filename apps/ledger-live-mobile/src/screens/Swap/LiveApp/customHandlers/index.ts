import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";

import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { swapRedirectToHistory } from "./swapRedirectToHistory";

export const swapCustomHandlers = ({
  accounts,
  dispatch,
}: {
  accounts: AccountLike[];
  dispatch: Dispatch;
}) => ({
  "custom.getFee": getFee(accounts),
  "custom.getTransactionByHash": getTransactionByHash(accounts),
  "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch),
  "custom.swapRedirectToHistory": swapRedirectToHistory,
});