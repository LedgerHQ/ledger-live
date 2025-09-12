import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Stake } from "@ledgerhq/coin-framework/api/types";

export type StakingOperation =
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "getStakedBalance"
  | "getUnstakedBalance"
  | "lock"
  | "unlock"
  | "withdraw"
  | "getPendingWithdrawals"
  | "getVoter";

export type StakingContractConfig = {
  contractAddress: string;
  functions: Partial<Record<StakingOperation, string>> & {
    // necessary function names below
    delegate: string;
    undelegate: string;
    getStakedBalance: string;
  };
  apiConfig?: {
    baseUrl: string;
    validatorsEndpoint: string;
  };
};

export interface StakeConditions {
  activatable?: boolean;
  revokable?: boolean;
  withdrawable?: boolean;
  status?: string;
}

export interface StakeData {
  type: "active" | "pending";
  hasPendingVote?: boolean;
  canActivate?: boolean; // 24h cooldown complete
  pendingWithdrawalsCount?: number;
}

export interface StakeActionCondition {
  operation: StakingOperation;
  enabled: boolean;
  reason?: string;
}

export interface RpcProvider {
  call: (params: { to: string; data: string }) => Promise<string>;
}

// Celo specific types for voter info
export interface CeloVote {
  group: string;
  pending: string | bigint;
  active: string | bigint;
}

export interface CeloVoterInfo {
  votes: CeloVote[];
}

export interface CeloPendingWithdrawal {
  value: string | bigint;
  timestamp: string | bigint;
}

export type StakeCreate = {
  currency: CryptoCurrency;
  address: string;
  currencyId: string;
  validatorAddress: string;
  config: StakingContractConfig;
};

type SeiDelegationBalance = {
  amount: string | number | bigint;
  denom: string;
};

type SeiDelegationDetails = {
  delegator_address: string;
  shares: string | number;
  decimals: string | number;
  validator_address: string;
};

export type SeiDelegation = {
  balance: SeiDelegationBalance;
  delegation: SeiDelegationDetails;
};

export type StakingFetcher = (
  address: string,
  config: StakingContractConfig,
  currency: CryptoCurrency,
) => Promise<Stake[]>;

export type StakingStrategy = {
  fetcher: StakingFetcher;
};

// Function signature for amount extractors
export type StakingExtractor = (decoded: unknown) => bigint;

export interface EncodeStakingDataParams {
  currencyId: string;
  operation: StakingOperation;
  config: StakingContractConfig;
  params: unknown[];
}
