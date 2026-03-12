import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { log } from "@ledgerhq/logs";
import type { AccountBridge } from "@ledgerhq/types-live";
import {
  address as TyphonAddress,
  types as TyphonTypes,
  Transaction as TyphonTransaction,
} from "@stricahq/typhonjs";
import { BigNumber } from "bignumber.js";
import { buildTransaction } from "./buildTransaction";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";
import type { CardanoAccount, Transaction } from "./types";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const estimateMaxSpendable: AccountBridge<
  Transaction,
  CardanoAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  if (mainAccount.cardanoResources.utxos.length === 0) {
    return new BigNumber(0);
  }

  if (account.type === "TokenAccount") {
    return account.balance;
  }

  const dummyRecipient =
    "addr1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv2t5am";
  let t: Transaction = {
    ...createTransaction(account),
    ...transaction,
    recipient: dummyRecipient,
    // amount field will not be used to build a transaction when useAllAmount is true
    amount: new BigNumber(0),
    useAllAmount: true,
  };
  let typhonTransaction: TyphonTransaction;
  try {
    t = await prepareTransaction(account, t);
    typhonTransaction = await buildTransaction(mainAccount, t);
  } catch (error) {
    log("cardano-error", "Failed to estimate max spendable: " + String(error));
    return new BigNumber(0);
  }
  const transactionAmount = typhonTransaction
    .getOutputs()
    .filter(
      o =>
        !(o.address instanceof TyphonAddress.BaseAddress) ||
        !(o.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS) ||
        o.address.paymentCredential.bipPath === undefined,
    )
    .reduce((total, o) => total.plus(o.amount), new BigNumber(0));

  return transactionAmount;
};
