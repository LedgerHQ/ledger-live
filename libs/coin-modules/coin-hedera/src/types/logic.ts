import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { OperationType } from "@ledgerhq/types-live";
import type BigNumber from "bignumber.js";
import type { HEDERA_OPERATION_TYPES } from "../constants";
import type { HederaOperationExtra } from "./bridge";
import type { ERC20TokenTransfer } from "./hgraph";
import type { HederaMirrorContractCallResult, HederaMirrorTransaction } from "./mirror";
import type { HederaThirdwebTransaction } from "./thirdweb";

export type EstimateFeesParams =
  | {
      currency: CryptoCurrency;
      operationType: Exclude<HEDERA_OPERATION_TYPES, HEDERA_OPERATION_TYPES.ContractCall>;
    }
  | {
      operationType: HEDERA_OPERATION_TYPES.ContractCall;
      txIntent: TransactionIntent;
    };

export interface EstimateFeesResult {
  tinybars: BigNumber;
  gas?: BigNumber;
}

// TODO: remove once migration to new API is complete
export interface OperationERC20 {
  thirdwebTransaction: HederaThirdwebTransaction;
  mirrorTransaction: HederaMirrorTransaction;
  contractCallResult: HederaMirrorContractCallResult;
  token: TokenCurrency;
}

export interface ERC20OperationFields {
  date: Date;
  type: OperationType;
  fee: BigNumber;
  value: BigNumber;
  senders: string[];
  recipients: string[];
  blockHeight: number;
  blockHash: string;
  extra: HederaOperationExtra;
  contract: string;
  standard: "erc20";
  hasFailed: false;
}

export interface OperationDetailsExtraField {
  key: string;
  value: string | number;
}

export interface StakingAnalysis {
  operationType: OperationType;
  targetStakingNodeId: number | null;
  previousStakingNodeId: number | null;
  stakedAmount: bigint;
}

export interface EnrichedERC20Transfer {
  transfer: ERC20TokenTransfer;
  contractCallResult: HederaMirrorContractCallResult;
  mirrorTransaction: HederaMirrorTransaction;
}

export type MergedTransaction =
  | { type: "mirror"; data: HederaMirrorTransaction }
  | { type: "erc20"; data: EnrichedERC20Transfer };

export interface SyntheticBlock {
  blockHeight: number;
  blockHash: string;
  blockTime: Date;
}
