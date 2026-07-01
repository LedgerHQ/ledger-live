import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import type { OperationType } from "@ledgerhq/types-live";
import type BigNumber from "bignumber.js";
import type { HederaCoinConfig } from "../config";
import type { HEDERA_OPERATION_TYPES } from "../constants";
import type { ERC20TokenTransfer } from "./hgraph";
import type { HederaMirrorContractCallResult, HederaMirrorTransaction } from "./mirror";

export type EstimateFeesParams =
  | {
      currencyId: string;
      operationType: Exclude<HEDERA_OPERATION_TYPES, HEDERA_OPERATION_TYPES.ContractCall>;
    }
  | {
      configOrCurrencyId: HederaCoinConfig | string;
      operationType: HEDERA_OPERATION_TYPES.ContractCall;
      txIntent: TransactionIntent;
    };

export interface EstimateFeesResult {
  tinybars: BigNumber;
  gas?: BigNumber;
}

export interface HederaERC20TokenBalance {
  contractAddress: string;
  balance: BigNumber;
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
  transfers: ERC20TokenTransfer[];
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
