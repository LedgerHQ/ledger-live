import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { HEDERA_DELEGATION_STATUS, HEDERA_TRANSACTION_MODES } from "../constants";

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string | undefined;
  maxFee?: BigNumber;
} & (
    | {
        mode: HEDERA_TRANSACTION_MODES.Send;
        gasLimit?: BigNumber;
        properties?: never;
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate;
        assetReference: string;
        assetOwner: string;
        properties: {
          token: TokenCurrency;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.Delegate;
        properties: {
          stakingNodeId: number | null;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.Undelegate;
        properties: {
          stakingNodeId: number | null;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.Redelegate;
        properties: {
          stakingNodeId: number | null;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.ClaimRewards;
        properties?: never;
      }
  );

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string | undefined;
  maxFee?: string;
} & (
    | {
        mode: HEDERA_TRANSACTION_MODES.Send;
        gasLimit?: string;
        properties?: never;
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate;
        assetReference: string;
        assetOwner: string;
        properties: {
          token: TokenCurrency;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.Delegate;
        properties: {
          stakingNodeId: number | null;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.Undelegate;
        properties: {
          stakingNodeId: number | null;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.Redelegate;
        properties: {
          stakingNodeId: number | null;
        };
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.ClaimRewards;
        properties?: never;
      }
  );

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TransactionTokenAssociate = Extract<
  Transaction,
  { mode: HEDERA_TRANSACTION_MODES.TokenAssociate }
>;

export type TransactionStaking = Extract<
  Transaction,
  {
    mode:
      | HEDERA_TRANSACTION_MODES.Delegate
      | HEDERA_TRANSACTION_MODES.Undelegate
      | HEDERA_TRANSACTION_MODES.Redelegate
      | HEDERA_TRANSACTION_MODES.ClaimRewards;
  }
>;

export interface HederaDelegation {
  nodeId: number;
  delegated: BigNumber;
  pendingReward: BigNumber;
}

export interface HederaEnrichedDelegation extends HederaDelegation {
  status: HEDERA_DELEGATION_STATUS;
  validator: HederaValidator;
}

interface HederaDelegationRaw {
  nodeId: number;
  delegated: string;
  pendingReward: string;
}

export interface HederaResources {
  maxAutomaticTokenAssociations: number;
  isAutoTokenAssociationEnabled: boolean;
  delegation: HederaDelegation | null;
}

export interface HederaResourcesRaw {
  maxAutomaticTokenAssociations: number;
  isAutoTokenAssociationEnabled: boolean;
  delegation: HederaDelegationRaw | null;
}

export type HederaAccount = Account & {
  hederaResources?: HederaResources;
};

export type HederaAccountRaw = AccountRaw & {
  hederaResources?: HederaResourcesRaw;
};

export type HederaOperationExtra = {
  consensusTimestamp?: string;
  transactionId?: string;
  associatedTokenId?: string;
  pagingToken?: string;
  gasConsumed?: number;
  gasLimit?: number;
  gasUsed?: number;
  memo?: string | null;
  targetStakingNodeId?: number | null;
  previousStakingNodeId?: number | null;
  stakedAmount?: BigNumber;
};

export type HederaValidator = {
  nodeId: number;
  minStake: BigNumber;
  maxStake: BigNumber;
  activeStake: BigNumber;
  activeStakePercentage: BigNumber;
  address: string;
  addressChecksum: string | null;
  name: string;
  overstaked: boolean;
};

export type HederaValidatorRaw = {
  nodeId: number;
  minStake: string;
  maxStake: string;
  activeStake: string;
  activeStakePercentage: string;
  address: string;
  addressChecksum: string | null;
  name: string;
  overstaked: boolean;
};

export type HederaPreloadData = {
  validators: HederaValidator[];
  associatedTokenId?: string;
};

export type HederaOperation = Operation<HederaOperationExtra>;
