import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import type { StakingContractConfig, StakingOperation } from "../types/staking";
import { USEI_TO_EVM_SCALE } from "../utils";
import { getCoinConfig } from "../config";
import { withApi } from "../network/node/rpc.common";
import { isExternalNodeConfig } from "../network/node/types";
import { getValidatorAddressById } from "./validators/monadResolver";

export function getStakingContractAddress(
  currencyId: string,
  ctx?: { mode: StakingOperation; valAddress?: string },
): string | undefined {
  const config = STAKING_CONTRACTS[currencyId];
  if (!config) return undefined;
  try {
    return config.contractAddress(ctx);
  } catch {
    return undefined;
  }
}

export const STAKING_CONTRACTS: Record<string, StakingContractConfig> = {
  // Sei EVM staking
  // Source: https://docs.sei.io/evm/precompiles/staking
  // claimReward routes to the distribution precompile: https://docs.sei.io/evm/precompiles/distribution
  sei_evm: {
    contractAddress: ctx => {
      switch (ctx?.mode) {
        case "claimReward":
          return "0x0000000000000000000000000000000000001007";
        default:
          return "0x0000000000000000000000000000000000001005";
      }
    },
    value: ({ amount }) => amount,
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
    rewardsStrategy: {
      type: "cosmos-rest",
      endpoint: "/cosmos/distribution/v1beta1/delegators/{address}/rewards",
      denom: "usei",
      scale: USEI_TO_EVM_SCALE,
    },
    // Distribution precompile 0x1007 emits one reward log per validator on claim.
    // Verified sig keccak256("<event>") with topics: [sig, delegator]; data layout
    // (string validator, uint256 amount) → amount is the 2nd word (after the string
    // offset), in usei → scale 10^12 to wei.
    rewardsEventDecoder: {
      contractAddress: "0x0000000000000000000000000000000000001007",
      topic0: "0xe9a2d1cd042608da4ebdf1fafb4a4658dfc6954ce121138e784b3f9372505d11",
      delegatorTopicIndex: 1,
      amountWordIndex: 1,
      scale: USEI_TO_EVM_SCALE,
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
    resolveValidatorAddress: async d => {
      return typeof d[0] === "string" ? d[0] : null;
    },
    resolveOperationAmount: async (decoded, operationType) => {
      switch (operationType) {
        case "undelegate": {
          const raw = decoded[1];
          return typeof raw === "bigint"
            ? new BigNumber((raw * USEI_TO_EVM_SCALE).toString())
            : null;
        }
        default:
          return null;
      }
    },
  },

  // Celo staking
  // Source: https://celo.blockscout.com/address/0x55E1A0C8f376964bd339167476063bFED7f213d5?tab=contract_source_code
  celo: {
    contractAddress: () => "0x55E1A0C8f376964bd339167476063bFED7f213d5",
    value: ({ amount }) => amount,
    functions: {
      delegate: "delegateGovernanceVotes",
      undelegate: "revokeDelegatedGovernanceVotes",
      getStakedBalance: "getAccountTotalLockedGold",
      getUnstakedBalance: "getTotalPendingWithdrawals",
    },
    resolveValidatorAddress: async d => {
      return typeof d[0] === "string" ? d[0] : null;
    },
    resolveOperationAmount: async (decoded, operationType) => {
      switch (operationType) {
        case "undelegate": {
          const raw = decoded[1];
          return typeof raw === "bigint" ? new BigNumber(raw.toString()) : null;
        }
        default:
          return null;
      }
    },
  },

  // Monad staking
  // Source: https://docs.monad.xyz/reference/staking/api
  // Source: https://docs.monad.xyz/monad-arch/consensus/staking
  monad: {
    // Native staking precompile — address 0x1000
    // There is no bytecode at this address; it is a precompile, not a smart contract.
    contractAddress: () => "0x0000000000000000000000000000000000001000",
    value: ({ amount }) => amount,
    functions: {
      // delegate(uint64 validatorId) payable — amount is msg.value (18-decimal MON wei).
      delegate: "delegate",
      // undelegate(uint64 validatorId, uint256 amount, uint8 withdrawId).
      // withdrawId is a 0-255 slot identifier per (validator, delegator) pair.
      undelegate: "undelegate",
      // withdraw(uint64 validatorId, uint8 withdrawId) — finalizes a matured undelegation slot.
      withdraw: "withdraw",
      // getDelegator(uint64 validatorId, address delegator) — returns stake, rewards, pending changes.
      getStakedBalance: "getDelegator",
      // claimRewards(uint64 validatorId).
      claimReward: "claimRewards",
      // compound(uint64 validatorId) — restakes accrued rewards in a single call.
      compoundReward: "compound",
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
    // Both claimRewards and compound emit ClaimRewards(uint64 indexed validatorId,
    // address indexed delegator, uint256 amount, uint256 epoch) on 0x1000 carrying the
    // reward amount in MON wei (18 dec). compound additionally emits Delegate(...) with the
    // same amount (the restake); filtering on this topic0 ignores it (no double-count).
    rewardsEventDecoder: {
      contractAddress: "0x0000000000000000000000000000000000001000",
      topic0: "0xcb607e6b63c89c95f6ae24ece9fe0e38a7971aa5ed956254f1df47490921727b",
      delegatorTopicIndex: 2,
      amountWordIndex: 0,
      scale: 1n,
    },
    // Monad uses epoch-based unbonding: WITHDRAWAL_DELAY = 1 epoch (~5.5 h).
    // Including the delegation-queue delay (1–2 epochs), the maximum wait is ~3 epochs ≈ 17 h.
    // Source: https://docs.monad.xyz/monad-arch/consensus/staking (WITHDRAWAL_DELAY constant)
    unbondingPeriodDays: 0.75,
    resolveValidatorAddress: d => {
      return typeof d[0] === "bigint"
        ? getValidatorAddressById("monad", d[0])
        : Promise.resolve(null);
    },
    resolveOperationAmount: async (decoded, operationType) => {
      switch (operationType) {
        case "undelegate": {
          const raw = decoded[1];
          return typeof raw === "bigint" ? new BigNumber(raw.toString()) : null;
        }
        default:
          return null;
      }
    },
  },

  // 0G staking - factory-per-validator model.
  // Source: https://docs.0g.ai/developer-hub/building-on-0g/contracts-on-0g/validator-contract-functions
  zero_gravity: {
    contractAddress: ctx => {
      const addr = ctx?.valAddress;
      if (!addr) throw new Error("0G staking requires a validator address");
      return addr;
    },
    value: ({ mode, amount, txValue }) => {
      return mode === "undelegate" ? (txValue ?? 0n) : amount;
    },
    functions: {
      delegate: "delegate",
      undelegate: "undelegate",
      getStakedBalance: "getDelegation",
    },
    // https://docs.0g.ai/developer-hub/building-on-0g/contracts-on-0g/validator-contract-functions#delegateaddress-delegatoraddress
    calldataAmountScale: 10n ** 9n,
    apiConfig: {
      baseUrl: "https://api.0g.exploreme.pro",
      validatorsEndpoint: "/api/v2/validators?limit=100",
    },
    // minWithdrawabilityDelay on registry 0xea224d = 0x30d40 = 200,000 blocks; at ~1 s/block = 2d 7h.
    // curl https://zero-gravity.coin.ledger.com -sX POST -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0xea224dBB52F57752044c0C86aD50930091F561B9","data":"0x279a0d76"},"latest"],"id":1}'
    unbondingPeriodDays: 2.31,
    explorerConfig: {
      validatorUrl: "https://explorer.0g.ai/mainnet/validators/$address/delegators",
    },
    resolveValidatorAddress: async (_, contractAddress) => {
      return contractAddress ? ethers.getAddress(contractAddress) : null;
    },
    resolveOperationAmount: async (decoded, operationType, currency, contractAddress) => {
      switch (operationType) {
        case "undelegate": {
          const shares = decoded[1];
          if (typeof shares !== "bigint") return null;
          const node = getCoinConfig(currency.id).info.node;
          if (!isExternalNodeConfig(node)) return null;
          try {
            return await withApi(
              currency,
              async provider => {
                const iface = new ethers.Interface([
                  "function convertToTokens(uint256 shares) view returns (uint256)",
                ]);
                const data = iface.encodeFunctionData("convertToTokens", [shares]);
                const raw = await provider.call({ to: contractAddress, data });
                const result = iface.decodeFunctionResult("convertToTokens", raw);
                if (!Array.isArray(result) || typeof result[0] !== "bigint") return null;
                return new BigNumber(result[0].toString());
              },
              node,
            );
          } catch {
            return null;
          }
        }
        default:
          return null;
      }
    },
    canUndelegate: delegation => {
      return delegation.shares?.gte(1e9) ?? true;
    },
  },
  somnia: {
    contractAddress: () => "0xBe367d410D96E1cAeF68C0632251072CDf1b8250",
    functions: {
      delegate: "delegateStake",
      undelegate: "undelegateStake",
      getStakedBalance: "getDelegationInfo",
      claimReward: "claimDelegatorRewards",
    },
    // Display names live off-chain at /api/validator-names on the official
    // dashboard — it's a flat { [address]: name } JSON map maintained by Somnia.
    // Treat it as a display overlay; the on-chain set remains authoritative.
    validatorNameSource: {
      baseUrl: "https://staking.somnia.network/api/validator-names",
    },
    value: ({ mode, amount }) => (mode === "delegate" ? amount : 0n),
    resolveValidatorAddress: async parameters => {
      return typeof parameters[0] === "string" ? parameters[0] : null;
    },
    resolveOperationAmount: async (decoded, operationType) => {
      switch (operationType) {
        case "undelegate": {
          const raw = decoded[1];
          return typeof raw === "bigint" ? new BigNumber(raw.toString()) : null;
        }
        default:
          return null;
      }
    },
  },
};
