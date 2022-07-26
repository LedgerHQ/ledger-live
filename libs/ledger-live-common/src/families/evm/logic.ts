import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { encodeOperationId } from "../../operation";
import {
  EtherscanOperation,
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "./types";
import APIS from "./explorers";

/**
 * Returns the domain to use to get the Etherscan-like explorer.
 * If no API is found, just return null
 */
export const scanApiForCurrency = (currency: CryptoCurrency): string | null => {
  const mainApi = APIS[currency.id.replace("_lite", "")];
  if (mainApi) {
    return mainApi;
  }

  const testnetApi = APIS[currency.isTestnetFor || ""];
  if (testnetApi) {
    return testnetApi.replace(
      "api",
      `api-${currency?.ethereumLikeInfo?.baseChain}`
    );
  }

  return null;
};

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const legacyTransactionHasFees = (tx: EvmTransactionLegacy): boolean =>
  Boolean((!tx.type || tx.type < 2) && tx.gasPrice);

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const eip1559TransactionHasFees = (tx: EvmTransactionEIP1559): boolean =>
  Boolean(tx.type === 2 && tx.maxFeePerGas && tx.maxPriorityFeePerGas);

/**
 * Helper to get total fee value for a tx depending on its type
 */
export const getEstimatedFees = (tx: EvmTransaction): BigNumber => {
  if (tx.type !== 2) {
    return (
      (tx as EvmTransactionLegacy)?.gasPrice?.multipliedBy(tx.gasLimit) ||
      new BigNumber(0)
    );
  }
  return (
    (tx as EvmTransactionEIP1559)?.maxFeePerGas
      ?.plus((tx as EvmTransactionEIP1559)?.maxPriorityFeePerGas)
      ?.multipliedBy(tx.gasLimit) || new BigNumber(0)
  );
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
