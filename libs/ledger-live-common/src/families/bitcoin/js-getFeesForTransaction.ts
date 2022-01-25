import { BigNumber } from "bignumber.js";
import type { Account } from "./../../types";
import type { Transaction } from "./types";
import { buildTransaction } from "./js-buildTransaction";
import { perCoinLogic } from "./logic";

const getFeesForTransaction = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}) => {
  const walletTx = await buildTransaction(account, transaction);
  const fees = new BigNumber(walletTx.fee).integerValue();
  let txInputs = walletTx.inputs.map((i) => {
    return {
      address: i.address,
      value: new BigNumber(i.value),
      previousTxHash: i.output_hash,
      previousOutputIndex: i.output_index,
    };
  });
  let txOutputs = walletTx.outputs.map((o) => {
    return {
      outputIndex: walletTx.outputs.indexOf(o),
      address: o.address,
      isChange: o.isChange,
      value: new BigNumber(o.value),
      hash: undefined,
      blockHeight: undefined,
      rbf: transaction.rbf,
    };
  });
  const perCoin = perCoinLogic[account.currency.id];

  if (perCoin) {
    const { syncReplaceAddress } = perCoin;

    if (syncReplaceAddress) {
      txInputs = txInputs.map((i) => ({
        ...i,
        address: i.address && syncReplaceAddress(i.address),
      }));
      txOutputs = txOutputs.map((o) => ({
        ...o,
        address: o.address && syncReplaceAddress(o.address),
      }));
    }
  }

  return {
    fees,
    txInputs,
    txOutputs,
  };
};

export default getFeesForTransaction;
