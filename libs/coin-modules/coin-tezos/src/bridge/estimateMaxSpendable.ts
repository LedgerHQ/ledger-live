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
  console.time("Total Execution Time"); // Start the total timer

  console.time("Step 1");
  console.timeLog("Total Execution Time", "1 - before");
  const mainAccount = getMainAccount(account, parentAccount) as TezosAccount;
  console.timeEnd("Step 1"); // Ends Step 1 timer and logs time

  console.time("Step 2");
  console.timeLog("Total Execution Time", "2 - before tx");
  const tx = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    // Estimate using a burn address that exists so we don't enter into NotEnoughBalanceBecauseDestinationNotCreated
    recipient: transaction?.recipient || TEZOS_BURN_ADDRESS,
    useAllAmount: true,
  });
  console.timeEnd("Step 2"); // Ends Step 2 timer and logs time

  console.time("Step 3");
  console.log("3 - after tx");
  // const estimation = await getEstimatedFees({
  //   account: mainAccount,
  //   transaction: tx,
  // });
  return  tx.amount;

  // console.log({estimationEstimateMaxSpendable: estimation});
  // console.timeEnd("Step 3"); // Ends Step 3 timer and logs time

  // console.timeLog("Total Execution Time", "4 - after estimation");
  // console.timeEnd("Total Execution Time"); // Ends the total timer and logs total time
  // As we use `useAllAmount`, we know we will receive an amount value.
  // return estimation.amount!;
};

export default estimateMaxSpendable;
