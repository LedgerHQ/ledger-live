import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { isValidAddress } from "../common-logic";
import { MINA_TOKEN_ID } from "../consts";
import { MinaAPIAccount, MinaSignedTransaction, Transaction } from "../types/common";
import {
  fetchAccountBalance,
  fetchAccountTransactions,
  fetchNetworkStatus,
  fetchTransactionMetadata,
  rosettaGetBlockInfo,
  rosettaSubmitTransaction,
} from "./rosetta";
import { RosettaBlockInfoResponse, RosettaTransaction } from "./rosetta/types";

export const getAccount = async (address: string): Promise<MinaAPIAccount> => {
  const networkStatus = await fetchNetworkStatus();
  let balance = new BigNumber(0);
  let spendableBalance = new BigNumber(0);
  try {
    const resp = await fetchAccountBalance(address);
    balance = new BigNumber(resp.balances[0].metadata.total_balance);
    spendableBalance = new BigNumber(resp.balances[0].metadata.liquid_balance);
  } catch (e) {
    log("info", "[mina] getAccount error:", {
      address,
      error: e,
    });
    // fail is expected for when account has no balance and no transactions
    /* empty */
  }

  return {
    blockHeight: networkStatus.current_block_identifier.index,
    balance,
    spendableBalance,
  };
};

export const getBlockInfo = async (blockHeight: number): Promise<RosettaBlockInfoResponse> => {
  const data = await rosettaGetBlockInfo(blockHeight);
  return data;
};

export const getTransactions = async (
  address: string,
  offset: number = 0,
): Promise<RosettaTransaction[]> => {
  const txns = await fetchAccountTransactions(address, offset);
  return txns.sort((a, b) => b.timestamp - a.timestamp);
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

export const getFees = async (
  txn: Transaction,
  address: string,
): Promise<{
  fee: BigNumber;
  accountCreationFee: BigNumber;
}> => {
  if (!txn.amount || !txn.recipient || !isValidAddress(txn.recipient)) {
    return { fee: txn.fees.fee, accountCreationFee: new BigNumber(0) };
  }

  const { data } = await fetchTransactionMetadata(
    address,
    txn.recipient,
    txn.fees.fee.toNumber(),
    txn.amount.toNumber(),
  );

  const accountCreationFee = data.metadata.account_creation_fee
    ? new BigNumber(data.metadata.account_creation_fee)
    : new BigNumber(0);

  return {
    fee: new BigNumber(data.suggested_fee[0].value),
    accountCreationFee,
  };
};

export const getNonce = async (txn: Transaction, address: string): Promise<number> => {
  if (!txn.recipient || !isValidAddress(txn.recipient)) {
    return txn.nonce;
  }

  if (!txn.amount || !txn.fees) {
    return txn.nonce;
  }

  const { data } = await fetchTransactionMetadata(
    address,
    txn.recipient,
    txn.fees.fee.toNumber(),
    txn.amount.toNumber(),
  );

  return parseInt(data.metadata.nonce);
};
