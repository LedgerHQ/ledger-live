import BigNumber from "bignumber.js";
import { TezosAccount, Transaction } from "../types";
import { estimateFees } from "../logic";

export type EstimatedFees = {
  fees: BigNumber;
  gasLimit: BigNumber;
  storageLimit: BigNumber;
  estimatedFees: BigNumber;
  amount?: BigNumber;
  taquitoError?: string;
};
/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export default async function getEstimatedFees({
  account,
  transaction,
}: {
  account: TezosAccount;
  transaction: Transaction;
}): Promise<EstimatedFees> {
  const estimate = await estimateFees({
    account: {
      xpub: account.xpub,
      address: account.freshAddress,
      balance: BigInt(account.balance.toString()),
      revealed: account.tezosResources.revealed,
    },
    transaction: {
      mode: transaction.mode,
      recipient: transaction.recipient,
      amount: BigInt(transaction.amount.toString()),
      useAllAmount: transaction.useAllAmount,
    },
  });

  return {
    fees: BigNumber(estimate.fees.toString()),
    gasLimit: BigNumber(estimate.gasLimit.toString()),
    storageLimit: BigNumber(estimate.storageLimit.toString()),
    estimatedFees: BigNumber(estimate.estimatedFees.toString()),
    amount: estimate.amount !== undefined ? BigNumber(estimate.amount.toString()) : BigNumber(0),
    taquitoError: estimate.taquitoError,
  };
}
