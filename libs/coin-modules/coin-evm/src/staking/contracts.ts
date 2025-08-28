import type { StakingContractConfig } from "../types/staking";

export const STAKING_CONTRACTS: Record<string, StakingContractConfig> = {
  // Sei EVM staking
  // Source: https://docs.sei.io/evm/precompiles/staking
  "0x0000000000000000000000000000000000001005": {
    delegate: "delegate",
    undelegate: "undelegate",
    redelegate: "redelegate",
    getStakedBalance: "delegation",
  },

  // Celo staking
  // Source: https://celo.blockscout.com/address/0x55E1A0C8f376964bd339167476063bFED7f213d5?tab=contract_source_code
  "0x55E1A0C8f376964bd339167476063bFED7f213d5": {
    delegate: "delegateGovernanceVotes",
    undelegate: "revokeDelegatedGovernanceVotes",
    getStakedBalance: "getAccountTotalLockedGold",
    getUnstakedBalance: "getTotalPendingWithdrawals",
  },

  // TODO: add Berachain + HyperEVM when confirmed (according to slack)
};
