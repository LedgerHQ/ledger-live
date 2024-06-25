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
  return estimateFees({
    account: {
      xpub: account.xpub,
      address: account.freshAddress,
      balance: account.balance,
      revealed: account.tezosResources.revealed,
    },
    transaction: {
      mode: transaction.mode,
      recipient: transaction.recipient,
      amount: transaction.amount.toNumber(),
      useAllAmount: transaction.useAllAmount,
    },
  });
}
