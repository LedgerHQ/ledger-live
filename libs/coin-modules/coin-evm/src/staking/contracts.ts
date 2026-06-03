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
    // Reserve 0.1 SEI (≈ 830k gas at 120 gwei) so that fee spikes between
    // prepareTransaction and broadcast do not cause the staking precompile to revert.
    delegationMaxAmountReserve: 10n ** 17n, // 0.1 SEI in wei (10^17)
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

  // Monad staking
  // Source: https://docs.monad.xyz/reference/staking/api
  // Source: https://docs.monad.xyz/monad-arch/consensus/staking
  monad: {
    // Native staking precompile — address 0x1000
    // There is no bytecode at this address; it is a precompile, not a smart contract.
    contractAddress: "0x0000000000000000000000000000000000001000",
    functions: {
      // delegate(uint64 validatorId) payable — amount is msg.value (18-decimal MON wei).
      delegate: "delegate",
      // undelegate(uint64 validatorId, uint256 amount, uint8 withdrawId).
      // withdrawId is a 0-255 slot identifier per (validator, delegator) pair.
      undelegate: "undelegate",
      // getDelegator(uint64 validatorId, address delegator) — returns stake, rewards, pending changes.
      getStakedBalance: "getDelegator",
      // claimRewards(uint64 validatorId).
      claimReward: "claimRewards",
    },
    // Human-readable names overlay. The precompile exposes no names, so we enrich
    // the on-chain set with the governed `monad-developers/validator-info` repo
    // (each validator PRs its own `<secpPubkey>.json`), keyed by compressed secp
    // pubkey hex. Names are display-only; if unreachable we fall back to
    // `Validator {id}`. Source: https://github.com/monad-developers/validator-info
    validatorNameSource: {
      baseUrl: "https://raw.githubusercontent.com/monad-developers/validator-info/main/mainnet/",
    },
    explorerConfig: {
      // Validator address derived from the secp pubkey (ethers.computeAddress); this is the
      // key for the explorer's per-validator page (not the operator's authAddress account).
      validatorUrl: "https://monadvision.com/validator/$address",
    },
    // Monad uses epoch-based unbonding: WITHDRAWAL_DELAY = 1 epoch (~5.5 h).
    // Including the delegation-queue delay (1–2 epochs), the maximum wait is ~3 epochs ≈ 17 h.
    // Source: https://docs.monad.xyz/monad-arch/consensus/staking (WITHDRAWAL_DELAY constant)
    unbondingPeriodDays: 0.75,
  },

  // TODO: add 0G next
};
