import type { SuiSystemStateInnerJson } from "./utils";

/** Per-validator overrides; `poolId` required, everything else defaults to a stable mainnet-shape value. */
export type FakeValidator = {
  poolId: string;
  validatorAddress?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  protocolPubkeyBytes?: string;
  networkPubkeyBytes?: string;
  workerPubkeyBytes?: string;
  proofOfPossession?: string;
  netAddress?: string;
  p2pAddress?: string;
  primaryAddress?: string;
  workerAddress?: string;
  votingPower?: number | string;
  gasPrice?: number | string;
  suiBalance?: number | string;
  poolTokenBalance?: number | string;
  rewardsPool?: number | string;
  exchangeRatesId?: string;
  exchangeRatesSize?: number | string;
  /** `null` deactivates the pool. */
  activationEpoch?: number | string | null;
  deactivationEpoch?: number | string | null;
  commissionRate?: number | string;
  nextEpochStake?: number | string;
};

/** Single source of truth for the `SuiSystemStateInnerJson` test shape; tests override only what they assert on. */
export function makeSystemStateJson(opts: {
  epoch?: number | string;
  validators?: ReadonlyArray<FakeValidator>;
}): SuiSystemStateInnerJson {
  const epoch = opts.epoch ?? 100;
  const validators = opts.validators ?? [];
  return {
    epoch,
    protocol_version: 1,
    system_state_version: 2,
    validators: {
      active_validators: validators.map(v => ({
        metadata: {
          sui_address: v.validatorAddress ?? "0xv",
          protocol_pubkey_bytes: v.protocolPubkeyBytes ?? "0xpk",
          network_pubkey_bytes: v.networkPubkeyBytes ?? "0xnk",
          worker_pubkey_bytes: v.workerPubkeyBytes ?? "0xwk",
          proof_of_possession: v.proofOfPossession ?? "0xpp",
          name: v.name ?? "V",
          description: v.description ?? "desc",
          image_url: v.imageUrl ?? "https://logo",
          project_url: v.projectUrl ?? "https://project",
          net_address: v.netAddress ?? "",
          p2p_address: v.p2pAddress ?? "",
          primary_address: v.primaryAddress ?? "",
          worker_address: v.workerAddress ?? "",
        },
        voting_power: v.votingPower ?? 100,
        operation_cap_id: "0xcap",
        gas_price: v.gasPrice ?? 800,
        staking_pool: {
          id: v.poolId,
          activation_epoch: v.activationEpoch === undefined ? 0 : v.activationEpoch,
          deactivation_epoch: v.deactivationEpoch ?? null,
          sui_balance: v.suiBalance ?? 1_000_000_000_000,
          rewards_pool: v.rewardsPool ?? 50_000_000_000,
          pool_token_balance: v.poolTokenBalance ?? 900_000_000_000,
          exchange_rates: {
            id: v.exchangeRatesId ?? "0xrates",
            size: v.exchangeRatesSize ?? 100,
          },
          pending_stake: 0,
          pending_total_sui_withdraw: 0,
          pending_pool_token_withdraw: 0,
        },
        commission_rate: v.commissionRate ?? 500,
        next_epoch_stake: v.nextEpochStake ?? 0,
        next_epoch_gas_price: 800,
        next_epoch_commission_rate: v.commissionRate ?? 500,
      })),
      total_stake: "0",
      pending_active_validators: null,
      pending_removals: null,
      staking_pool_mappings: { id: "0xmap", size: validators.length },
      inactive_validators: null,
      validator_candidates: null,
      at_risk_validators: null,
    },
    reference_gas_price: 100,
    epoch_start_timestamp_ms: 0,
  };
}
