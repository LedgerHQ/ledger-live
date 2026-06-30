import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";

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

    // Typhon's <2 ADA dust guard folds the entire balance into the fee when no spendable output
    // can be formed — a low-balance account, or simply before an amount is entered (amount 0). That
    // donation is not a real network fee and the send is blocked anyway (AmountRequired / below
    // min-UTXO), so report the protocol-minimum fee rather than the inflated ~whole-balance value
    // (LIVE-33176). A real send (amount > 0) keeps getFee(), which legitimately includes any dust
    // folded into the fee of an otherwise-valid transaction — so we never under-disclose.
    const transactionFees =
      !transaction.subAccountId && transactionAmount.isZero()
        ? cardanoTransaction.calculateFee()
        : cardanoTransaction.getFee();

    patch = { fees: transactionFees, amount: transactionAmount };
  } catch {
    patch = { fees: new BigNumber(0), amount: transaction.amount };
  }

  return updateTransaction(transaction, patch);
};
