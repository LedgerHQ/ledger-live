import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";

import { AccountBridge } from "@ledgerhq/types-live";
import { types as TyphonTypes, address as TyphonAddress } from "@stricahq/typhonjs";
import { BigNumber } from "bignumber.js";
import { fetchNetworkInfo } from "./api/getNetworkInfo";
import { buildTransaction } from "./buildTransaction";
import { CardanoAccount, Transaction } from "./types";

/**
 * Prepare transaction before checking status
 *
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  CardanoAccount
>["prepareTransaction"] = async (account, transaction) => {
  let patch = {};

  if (!transaction.protocolParams) {
    const networkInfo = await fetchNetworkInfo(account.currency);
    transaction = updateTransaction(transaction, {
      protocolParams: networkInfo.protocolParams,
    });
  }

  try {
    const cardanoTransaction = await buildTransaction(account, transaction);
    const transactionFees = cardanoTransaction.getFee();
    const transactionAmount = transaction.subAccountId
      ? transaction.amount
      : cardanoTransaction
          .getOutputs()
          .filter(
            o =>
              !(o.address instanceof TyphonAddress.BaseAddress) ||
              !(o.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS) ||
              o.address.paymentCredential.bipPath === undefined,
          )
          .reduce((total, o) => total.plus(o.amount), new BigNumber(0));

    patch = { fees: transactionFees, amount: transactionAmount };
  } catch {
    patch = { fees: new BigNumber(0), amount: transaction.amount };
  }

  return updateTransaction(transaction, patch);
};
