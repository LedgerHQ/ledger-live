import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";
import type { PolkadotAccount, Transaction } from "../types";
import { isFirstBond, getNonce } from "./utils";

export const extractExtrinsicArg = (
  account: PolkadotAccount,
  transaction: Transaction,
): CreateExtrinsicArg => ({
  mode: transaction.mode,
  amount: transaction.amount,
  recipient: transaction.recipient,
  isFirstBond: isFirstBond(account),
  validators: transaction.validators,
  useAllAmount: transaction.useAllAmount,
  rewardDestination: transaction.rewardDestination,
  numSlashingSpans: account.polkadotResources?.numSlashingSpans,
  era: transaction.era,
});

/**
 *
 * @param {Account} account
 * @param {Transaction} transaction
 * @param {boolean} forceLatestParams - forces the use of latest transaction params
 */
export const buildTransaction = async (
  account: PolkadotAccount,
  transaction: Transaction,
  forceLatestParams = false,
) => {
  return craftTransaction(
    account.freshAddress,
    getNonce(account),
    extractExtrinsicArg(account, transaction),
    forceLatestParams,
    getCryptoCurrencyById(account.currency.id),
  );
};
