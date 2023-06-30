import { AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { getLLDCoinFamily } from "~/renderer/families";
import BigNumber from "bignumber.js";

export const getAccountHistoryLowestBlock = ({ account }: { account: AccountLike }) => {
  if (account && isAccount(account)) {
    const { historyLowestBlock } = getLLDCoinFamily(account.currency.family);
    if (historyLowestBlock) {
      return historyLowestBlock({ account });
    }
  }

  return new BigNumber(0);
};
