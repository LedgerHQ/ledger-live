import { useAccountBridgeMany } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useSelector } from "./redux";

export function useAreAccountsEmpty(): boolean {
  const accounts = useSelector(accountsSelector);
  const bridges = useAccountBridgeMany(accounts);
  return accounts.length > 0 && accounts.every((a, i) => bridges[i].isAccountEmpty(a));
}
