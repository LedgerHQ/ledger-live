import {
  address as TyphonAddress,
  types as TyphonTypes,
  Transaction as TyphonTransaction,
} from "@stricahq/typhonjs";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { CardanoAccount, Transaction } from "./types";
import { createTransaction } from "./createTransaction";
import { buildTransaction } from "./buildTransaction";

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
  const t: Transaction = {
    ...createTransaction(account),
    ...transaction,
    recipient: dummyRecipient,
    // amount field will not be used to build a transaction when useAllAmount is true
    amount: new BigNumber(0),
    useAllAmount: true,
  };
  let typhonTransaction: TyphonTransaction;
  try {
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
