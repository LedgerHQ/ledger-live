import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { calculateGasFees } from "../common-logic";
import type { Transaction } from "../types";

const PATTERN_ADDRESS_IN_TOKEN_ACCOUNT_ID = /:(0x\w+):/;

const getAddressFromTokenAccountId = (tokenAccountId: string): string | undefined =>
  PATTERN_ADDRESS_IN_TOKEN_ACCOUNT_ID.exec(tokenAccountId)?.[1];

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
        return spendable;
      }
    }
  }

  return new BigNumber(0);
};
