import BigNumber from "bignumber.js";
import { MinaAPIAccount, MinaSignedTransaction, Transaction } from "../types";
import {
  fetchAccountBalance,
  fetchAccountTransactions,
  fetchBlockInfo,
  fetchNetworkStatus,
  fetchTransactionMetadata,
  rosettaSubmitTransaction,
} from "./rosetta";
import { RosettaTransactionWithDate } from "./rosetta/types";
import { MINA_TOKEN_ID } from "../consts";
import { isValidAddress } from "../logic";

export const getAccount = async (address: string): Promise<MinaAPIAccount> => {
  const networkStatus = await fetchNetworkStatus();
  let balance = new BigNumber(0);
  let spendableBalance = new BigNumber(0);
  try {
    const resp = await fetchAccountBalance(address);
    balance = new BigNumber(resp.balances[0].metadata.total_balance);
    spendableBalance = new BigNumber(resp.balances[0].metadata.liquid_balance);
  } catch (e) {
    /* empty */
  }

  return {
    blockHeight: networkStatus.current_block_identifier.index,
    balance,
    spendableBalance,
  };
};

export const getTransactions = async (address: string): Promise<RosettaTransactionWithDate[]> => {
  const res = await fetchAccountTransactions(address);

  const txns: RosettaTransactionWithDate[] = [];
  for (const txn of res.transactions) {
    const date = await getBlockDate(txn.block_identifier.hash);
    txns.push({ ...txn, date: date });
  }

  return txns;
};

export const getBlockDate = async (hash: string): Promise<Date> => {
  const res = await fetchBlockInfo(hash);

  return new Date(res.block.timestamp);
};

export const broadcastTransaction = async (txn: MinaSignedTransaction): Promise<string> => {
  const { nonce, receiverAddress, amount, fee, memo, senderAddress } = txn.transaction;
  const blob = {
    signature: txn.signature,
    payment: {
      to: receiverAddress,
      from: senderAddress,
      fee: fee.toFixed(),
      token: MINA_TOKEN_ID,
      nonce: nonce.toFixed(),
      memo: memo ?? null,
      amount: amount.toFixed(),
      valid_until: null,
    },
    stake_delegation: null,
  };

  const { data } = await rosettaSubmitTransaction(JSON.stringify(blob));

  return data.transaction_identifier.hash;
};

export const getFees = async (txn: Transaction, address: string): Promise<BigNumber> => {
  if (!txn.amount || !txn.recipient || !isValidAddress(txn.recipient)) {
    return txn.fees;
  }

  const { data } = await fetchTransactionMetadata(
    address,
    txn.recipient,
    txn.fees.toNumber(),
    txn.amount.toNumber(),
  );

  return new BigNumber(data.suggested_fee[0].value);
};

export const getNonce = async (txn: Transaction, address: string): Promise<BigNumber> => {
  const { data } = await fetchTransactionMetadata(
    address,
    txn.recipient,
    txn.fees.toNumber(),
    txn.amount.toNumber(),
  );

  return new BigNumber(data.metadata.nonce);
};
