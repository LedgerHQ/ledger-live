import type { StakingContractConfig } from "../types/staking";
import { USEI_TO_EVM_SCALE } from "../utils";

export const STAKING_CONTRACTS: Record<string, StakingContractConfig> = {
  // Sei EVM staking
  // Source: https://docs.sei.io/evm/precompiles/staking
  sei_evm: {
    contractAddress: "0x0000000000000000000000000000000000001005",
    specificContractAddressByOperation: {
      // https://docs.sei.io/evm/precompiles/distribution
      claimReward: "0x0000000000000000000000000000000000001007",
    },
    functions: {
      delegate: "delegate",
      undelegate: "undelegate",
      redelegate: "redelegate",
      getStakedBalance: "delegation",
      claimReward: "withdrawDelegationRewards",
    },
    apiConfig: {
      baseUrl: "https://rest.sei-apis.com/",
      validatorsEndpoint:
        "/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200",
      // Source: https://docs.sei.io/evm/precompiles/cosmwasm-precompiles/addr
      precompileAddress: {
        address: "0x0000000000000000000000000000000000001004",
        abi: "function getSeiAddr(address addr) external view returns (string memory response)",
      },
    },
    redelegationStrategy: {
      type: "cosmos-rest",
      hrp: "sei",
      endpoint: "/cosmos/staking/v1beta1/delegators/{address}/redelegations",
    },
    explorerConfig: {
      validatorUrl: "https://seistream.app/validators/$address",
    },
    // 21-day unbonding on undelegation, as documented for Sei (same staking layer as
    // EVM precompile staking). Source: https://docs.sei.io/learn/general-staking
    // (sections Un-delegation and Un-Bonding).
    unbondingPeriodDays: 21,
    // Cosmos SDK enforces at most 7 concurrent active redelegation entries per account.
    maxRedelegations: 7,
    // The redelegate/undelegate precompile encodes amounts in usei (6 decimals).
    // Multiply by this scale to convert back to the EVM-native 18-decimal unit.
    calldataAmountScale: USEI_TO_EVM_SCALE,
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
