import { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fetchChainBalances } from "./api/network";
import { createTransaction } from "./prepareTransaction";
import { Transaction } from "./types";
import { baseUnitToKda } from "./utils";

export const estimateMaxSpendable = async ({
  account,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  if (!transaction) {
    transaction = createTransaction();
  }

  if (account.type !== "Account") {
    return new BigNumber(0);
  }

  const chains = await fetchChainBalances(account.freshAddress);

  const senderChain = chains?.find(
    ({ chainId }) => chainId === transaction.senderChainId.toString(),
  );

  if (senderChain?.balance === undefined) {
    return new BigNumber(0);
  }

  const fees = transaction.gasPrice.multipliedBy(transaction.gasLimit);

  const estimate = baseUnitToKda(senderChain.balance).minus(fees);

  return estimate.lt(0) ? new BigNumber(0) : estimate;
};

export default estimateMaxSpendable;
