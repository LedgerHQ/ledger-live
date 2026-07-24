import BigNumber from "bignumber.js";
import invariant from "invariant";
import { isAleoAccount } from "@ledgerhq/coin-aleo/logic/utils";
import type { AccountBridgeExtensions } from "@ledgerhq/types-live";

const extensions: AccountBridgeExtensions = {
  getWalletApiSpendableBalance: account => {
    invariant(isAleoAccount(account), "aleo: invalid account in bridgeExtensions");

    if (account.type === "TokenAccount") {
      return account.transparentBalance;
    }

    return account.aleoResources?.transparentBalance ?? new BigNumber(0);
  },
};

export default extensions;
