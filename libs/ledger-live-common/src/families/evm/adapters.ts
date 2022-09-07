import eip55 from "eip55";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../operation";
import {
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  EtherscanOperation,
} from "./types";

/**
 * Adapter to convert a Ledger Live transaction to an Ethers transaction
 */
export const transactionToEthersTransaction = (
  tx: EvmTransaction,
  // Account is necessary because some RPC nodes need to have the address
  // into the transaction to estimate its fees or will throw
  account: Account
): ethers.Transaction => {
  const ethersTx = {
    from: account.freshAddress,
    to: tx.recipient,
    value: tx.amount
      ? ethers.BigNumber.from(tx.amount.toFixed())
      : ethers.BigNumber.from(0),
    data: tx.data ? `0x${tx.data.toString("hex")}` : undefined,
    gasLimit: ethers.BigNumber.from(tx.gasLimit.toFixed()),
    nonce: tx.nonce,
    chainId: tx.chainId,
    type: tx.type,
  } as Partial<ethers.Transaction>;

  // is EIP-1559 transaction (type 2)
  if (tx.type === 2) {
    ethersTx.maxFeePerGas = ethers.BigNumber.from(
      (tx as EvmTransactionEIP1559).maxFeePerGas.toFixed()
    );
    ethersTx.maxPriorityFeePerGas = ethers.BigNumber.from(
      (tx as EvmTransactionEIP1559).maxPriorityFeePerGas.toFixed()
    );
  } else {
    // is Legacy transaction (type 0)
    ethersTx.gasPrice = ethers.BigNumber.from(
      (tx as EvmTransactionLegacy).gasPrice.toFixed()
    );
  }

  return ethersTx as ethers.Transaction;
};

/**
 * Adapter to convert an Etherscan-like operation into a Ledger Live Operation
 */
export const etherscanOperationToOperation = (
  accountId: string,
  address: string,
  tx: EtherscanOperation
): Operation | null => {
  const from = eip55.encode(tx.from);
  const to = tx.to ? eip55.encode(tx.to) : "";
  const value = new BigNumber(tx.value);
  const fee = new BigNumber(tx.gasUsed).times(new BigNumber(tx.gasPrice));

  const type = ((): OperationType => {
    // Do not show interaction with Smart Contract
    if (tx.contractAddress) {
      return "NONE";
    }

    if (to === eip55.encode(address)) {
      return "IN";
    }
    if (from === eip55.encode(address)) {
      return "OUT";
    }

    return "NONE";
  })();

  try {
    return {
      id: encodeOperationId(accountId, tx.hash, type),
      hash: tx.hash,
      type: type,
      value: type === "OUT" ? value.plus(fee) : value,
      fee,
      senders: [from],
      recipients: [to],
      blockHeight: parseInt(tx.blockNumber, 10),
      blockHash: tx.blockHash,
      transactionSequenceNumber: parseInt(tx.nonce, 10),
      accountId: accountId,
      date: new Date(parseInt(tx.timeStamp, 10) * 1000),
      extra: {},
    };
  } catch (e) {
    // if something went wrong while parsing the etherscan operation, just return null
    return null;
  }
};
