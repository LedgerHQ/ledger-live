import BigNumber from "bignumber.js";
import { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { TezosAccount, Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import getEstimatedFees from "./getFeesForTransaction";

const TEZOS_BURN_ADDRESS = "tz1burnburnburnburnburnburnburjAYjjX";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount) as TezosAccount;
  const tx = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    // estimate using a burn address that exists so we don't enter into NotEnoughBalanceBecauseDestinationNotCreated
    recipient: transaction?.recipient || TEZOS_BURN_ADDRESS,
    useAllAmount: true,
  });
  const estimation = await getEstimatedFees({
    account: mainAccount,
    transaction: tx,
  });

  // As we use `useAllAmount`, we know we will receive an amount value.
  return estimation.amount!;
};

export default estimateMaxSpendable;
