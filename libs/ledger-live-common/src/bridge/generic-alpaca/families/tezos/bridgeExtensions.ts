import { isAccountDelegating } from "@ledgerhq/coin-tezos/network/bakers";
import type { Account, AccountBridge } from "@ledgerhq/types-live";

const extensions: Partial<AccountBridge<any>> = {
  getStakesCount: (account: Account) => (isAccountDelegating(account) ? 1 : 0),
};

export default extensions;
