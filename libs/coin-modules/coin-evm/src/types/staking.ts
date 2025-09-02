import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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
};

export type StakeCreate = {
  currency: CryptoCurrency;
  address: string;
  currencyId: string;
  validatorAddress: string;
  config: StakingContractConfig;
};
