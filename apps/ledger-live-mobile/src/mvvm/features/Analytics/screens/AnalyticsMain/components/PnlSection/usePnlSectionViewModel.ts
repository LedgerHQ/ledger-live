import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { useShouldDisplayAnalyticsPnl } from "LLM/features/Analytics/hooks/useShouldDisplayAnalyticsPnl";
import type { PnlSectionViewModel } from "./types";
import { usePnlSectionModel } from "./usePnlSectionModel";

/** The Portfolio-wide PnL: every account. */
export function usePnlSectionViewModel(): PnlSectionViewModel {
  const shouldDisplayPnl = useShouldDisplayAnalyticsPnl();
  const accounts = useSelector(shallowAccountsSelector);
  return usePnlSectionModel({ accounts, shouldDisplayPnl });
}
