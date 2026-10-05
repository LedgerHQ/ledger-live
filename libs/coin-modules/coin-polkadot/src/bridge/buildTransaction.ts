import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { PolkadotContext } from "../config";
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
 */
export const buildTransaction = async (
  context: PolkadotContext,
  account: PolkadotAccount,
  transaction: Transaction,
) => {
  const config = await context.config(account.currency.id);
  return craftTransaction(
    config,
    account.freshAddress,
    getNonce(account),
    extractExtrinsicArg(account, transaction),
    getCryptoCurrencyById(account.currency.id),
  );
};
