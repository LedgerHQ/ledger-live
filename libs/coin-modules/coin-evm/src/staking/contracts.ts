import type { StakingContractConfig } from "../types/staking";

export const STAKING_CONTRACTS: Record<string, StakingContractConfig> = {
  // Sei EVM staking
  // Source: https://docs.sei.io/evm/precompiles/staking
  sei_evm: {
    contractAddress: "0x0000000000000000000000000000000000001005",
    functions: {
      delegate: "delegate",
      undelegate: "undelegate",
      redelegate: "redelegate",
      getStakedBalance: "delegation",
    },
    apiConfig: {
      baseUrl: "https://sei-api.polkachu.com",
      validatorsEndpoint:
        "/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200",
    },
  },

  // Celo staking
  // Source: https://celo.blockscout.com/address/0x55E1A0C8f376964bd339167476063bFED7f213d5?tab=contract_source_code
  celo: {
    contractAddress: "0x55E1A0C8f376964bd339167476063bFED7f213d5",
    functions: {
      delegate: "delegateGovernanceVotes",
      undelegate: "revokeDelegatedGovernanceVotes",
      getStakedBalance: "getAccountTotalLockedGold",
      getUnstakedBalance: "getTotalPendingWithdrawals",
    },
  },

  // TODO: add Berachain + HyperEVM when confirmed (according to slack)
};
