import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";

import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { swapRedirectToHistory } from "./swapRedirectToHistory";
import { FeeModalState } from "../WebView";

export const swapCustomHandlers = ({
  accounts,
  dispatch,
  setFeeModalState,
}: {
  accounts: AccountLike[];
  dispatch: Dispatch;
  setFeeModalState: React.Dispatch<React.SetStateAction<FeeModalState>>;
}) => ({
  "custom.getFee": getFee(accounts, setFeeModalState),
  "custom.getTransactionByHash": getTransactionByHash(accounts),
  "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch),
  "custom.swapRedirectToHistory": swapRedirectToHistory,
});
