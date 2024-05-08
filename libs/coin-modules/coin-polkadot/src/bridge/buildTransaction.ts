import type { PolkadotAccount, Transaction } from "../types";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";
import { isFirstBond, getNonce } from "./utils";

export const extractExtrinsicArg = (a: PolkadotAccount, t: Transaction): CreateExtrinsicArg => ({
  mode: t.mode,
  amount: t.amount,
  recipient: t.recipient,
  isFirstBond: isFirstBond(a),
  validators: t.validators,
  useAllAmount: t.useAllAmount,
  rewardDestination: t.rewardDestination,
  numSlashingSpans: a.polkadotResources?.numSlashingSpans,
  era: t.era,
});

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 * @param {boolean} forceLatestParams - forces the use of latest transaction params
 */
export const buildTransaction = async (
  a: PolkadotAccount,
  t: Transaction,
  forceLatestParams = false,
) => {
  return craftTransaction(
    a.freshAddress,
    getNonce(a),
    extractExtrinsicArg(a, t),
    forceLatestParams,
  );
};
