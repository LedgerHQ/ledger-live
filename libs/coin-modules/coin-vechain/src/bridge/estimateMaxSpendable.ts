import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { calculateGasFees } from "../common-logic";
import type { Transaction } from "../types";

const getAddressFromTokenAccountId = (tokenAccountId: string): string | undefined =>
  tokenAccountId.match(/:(0x\w+):/)?.[1];

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}): Promise<BigNumber> => {
  if (account.type === "Account" || !transaction) {
    return account.balance;
  }

  if (account.type === "TokenAccount") {
    const originAddress = parentAccount?.freshAddress || getAddressFromTokenAccountId(account.id);

    if (originAddress) {
      const { estimatedGasFees: maxTokenFees } = await calculateGasFees(
        transaction,
        true,
        originAddress,
      );
      const spendable = account.balance.minus(maxTokenFees);

      if (spendable.gt(0)) {
        return account.balance.minus(maxTokenFees);
      }
    }
  }

  return new BigNumber(0);
};
