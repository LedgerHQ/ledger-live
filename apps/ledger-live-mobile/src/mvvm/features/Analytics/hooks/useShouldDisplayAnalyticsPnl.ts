import { useSelector } from "~/context/hooks";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { shallowAccountsSelector } from "~/reducers/accounts";

export function useShouldDisplayAnalyticsPnl(): boolean {
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("mobile");
  const accounts = useSelector(shallowAccountsSelector);
  return isPnlFlagOn && accounts.length > 0;
}
