import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";

export function useShouldDisplayAnalyticsPnl(): boolean {
  const accounts = useSelector(shallowAccountsSelector);
  return accounts.length > 0;
}
