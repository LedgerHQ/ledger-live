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
  mode: EvmTransactionMode;
  // transaction number, relative to the account. used to sequence transactions
  nonce: number;
  // maximum of gas (as unit of computation) used by the transaction
  gasLimit: BigNumber;
  // id of the blockchain to use (used at the signature level for EIP-155)
  chainId: number;
  // buffer of the calldata that will be used by the smart contract
  data?: Buffer | null;
  // type of the transaction (will determine if transaction is a legacy transaction or an EIP-1559 one)
  type?: number;
  // additional fees can be expected on some Layer 2 chains.
  // It's an additional cost to take into account while estimating the cost of the tx.
  additionalFees?: BigNumber;
};

export type EvmTransactionLegacy = EvmTransactionBase & {
  type?: 0 | 1;
  gasPrice: BigNumber;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559 = EvmTransactionBase & {
  type: 2;
  gasPrice?: never;
  maxPriorityFeePerGas: BigNumber;
  maxFeePerGas: BigNumber;
};

export type Transaction = EvmTransactionLegacy | EvmTransactionEIP1559;

export type EvmTransactionBaseRaw = TransactionCommonRaw & {
  family: "evm";
  mode: EvmTransactionMode;
  nonce: number;
  gasLimit: string;
  chainId: number;
  data?: string | null;
  type?: number;
  additionalFees?: string;
};

export type EvmTransactionLegacyRaw = EvmTransactionBaseRaw & {
  type?: 0 | 1;
  gasPrice: string;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559Raw = EvmTransactionBaseRaw & {
  type: 2;
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

export type EtherscanERC20Event = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type FeeHistory = {
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  oldestBlock: string;
  reward: string[][];
};

export type FeeData = {
  maxFeePerGas: null | BigNumber;
  maxPriorityFeePerGas: null | BigNumber;
  gasPrice: null | BigNumber;
};
