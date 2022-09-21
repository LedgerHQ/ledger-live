import BigNumber from "bignumber.js";
import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type EvmTransactionMode = "send";

export type EvmTransactionBase = TransactionCommon & {
  family: "evm";
  mode: "send";
  nonce: number;
  gasLimit: BigNumber;
  chainId: number;
  data?: Buffer | null;
  type?: number;
};

export type EvmTransactionLegacy = EvmTransactionBase & {
  gasPrice: BigNumber;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559 = EvmTransactionBase & {
  gasPrice?: never;
  maxPriorityFeePerGas: BigNumber;
  maxFeePerGas: BigNumber;
};

export type Transaction = EvmTransactionLegacy | EvmTransactionEIP1559;

export type EvmTransactionBaseRaw = TransactionCommonRaw & {
  family: "evm";
  mode: "send";
  nonce: number;
  gasLimit: string;
  chainId: number;
  data?: string | null;
  type?: number;
};

export type EvmTransactionLegacyRaw = EvmTransactionBaseRaw & {
  gasPrice: string;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559Raw = EvmTransactionBaseRaw & {
  gasPrice?: never;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

export type TransactionRaw = EvmTransactionLegacyRaw | EvmTransactionEIP1559Raw;

export type EtherscanOperation = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
