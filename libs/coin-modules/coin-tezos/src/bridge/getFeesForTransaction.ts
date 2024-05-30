import { DerivationType } from "@taquito/ledger-signer";
import { compressPublicKey } from "@taquito/ledger-signer/dist/lib/utils";
import { DEFAULT_FEE, DEFAULT_STORAGE_LIMIT, Estimate } from "@taquito/taquito";
import { b58cencode, Prefix, prefix } from "@taquito/utils";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import tezosToolkit from "../network/tezosToolkit";
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
