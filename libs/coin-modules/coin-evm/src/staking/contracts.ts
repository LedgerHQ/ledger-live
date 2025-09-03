import type { StakingContractConfig } from "../types/staking";

export const STAKING_CONTRACTS: Record<string, StakingContractConfig> = {
  // Sei EVM staking
  // Source: https://docs.sei.io/evm/precompiles/staking
  sei_network_evm: {
    contractAddress: "0x0000000000000000000000000000000000001005",
    functions: {
      delegate: "delegate",
      undelegate: "undelegate",
      redelegate: "redelegate",
      getStakedBalance: "delegation",
    },
    validators: [
      // ref: https://sei.explorers.guru/validators
      "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn", // Figment
      "seivaloper1ummny4p645xraxc4m7nphf7vxawfzt3p5hn47t", // Everstake
      "seivaloper16pj5gljqnqs0ajxakccfjhu05yczp98743ctgy", // Chorus One
      "seivaloper1hnkkqnzwmyw652muh6wfea7xlfgplnyj0ku4w4", // Cosmostation
      "seivaloper1mpe9rdk7ycujge7r9ncjt4ekamgrdcygvzwqe8", // Polkachu
      "seivaloper1u9xeaqdjz3kky2ymdhdsn0ra5uy9tc3eqkjc8w", // Kiln
      "seivaloper15xgfk9cnt56xjvqvetjvg3wlqlslfnqfc03dwk", // STAKEME
    ],
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
