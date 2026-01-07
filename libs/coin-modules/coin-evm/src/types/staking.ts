import type { Stake } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type StakingOperation =
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "getStakedBalance"
  | "getUnstakedBalance";

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

/**
 * Configuration for a staking strategy
 */
export type StakingStrategy = {
  fetcher: StakingFetcher;
};

/**
 * Function signature for amount extractors
 */
export type StakingExtractor = (decoded: unknown) => bigint;

export interface EncodeStakingDataParams {
  currencyId: string;
  operation: StakingOperation;
  config: StakingContractConfig;
  params: unknown[];
}
