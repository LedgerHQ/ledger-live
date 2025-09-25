import type {
  TokenAccount,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  Transaction as VechainSDKTransaction,
  TransactionBody as VechainSDKTransactionBody,
  TransactionClause as VechainSDKTransactionClause,
} from "@vechain/sdk-core";

/**
 * VeChain SDK Transaction params, it's defined here to create a naming convention
 * between the Ledger Live Transaction and the VeChain SDK Transaction and improve readability
 */
export { VechainSDKTransaction };
export type { VechainSDKTransactionBody, VechainSDKTransactionClause };

export type Transaction = TransactionCommon & {
  family: "vechain";
  estimatedFees: string;
  body: VechainSDKTransactionBody;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "vechain";
  estimatedFees: string;
  body: VechainSDKTransactionBody;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TransactionInfo = {
  isTokenAccount: boolean;
  amount: BigNumber;
  balance: BigNumber;
  spendableBalance: BigNumber;
  tokenAccount: TokenAccount | undefined;
  estimatedFees: string;
  estimatedGas: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
};
