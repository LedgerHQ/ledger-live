import type { SuiSystemStateInnerJson } from "./utils";

/** Per-validator overrides; only the fields any current test actually exercises are tunable. */
export type FakeValidator = {
  poolId: string;
  validatorAddress?: string;
  name?: string;
  suiBalance?: number | string;
  poolTokenBalance?: number | string;
  exchangeRatesId?: string;
  /** `null` deactivates the pool. */
  activationEpoch?: number | string | null;
  commissionRate?: number | string;
};

/** Single source of truth for the `SuiSystemStateInnerJson` test shape; tests override only what they assert on. */
export function makeSystemStateJson(opts: {
  epoch?: number | string;
  validators?: ReadonlyArray<FakeValidator>;
}): SuiSystemStateInnerJson {
  return {
    epoch: opts.epoch ?? 100,
    validators: {
      active_validators: (opts.validators ?? []).map(v => ({
        metadata: {
          sui_address: v.validatorAddress ?? "0xv",
          name: v.name ?? "V",
          description: "desc",
          image_url: "https://logo",
          project_url: "https://project",
        },
        staking_pool: {
          id: v.poolId,
          activation_epoch: v.activationEpoch === undefined ? 0 : v.activationEpoch,
          sui_balance: v.suiBalance ?? 1_000_000_000_000,
          pool_token_balance: v.poolTokenBalance ?? 900_000_000_000,
          exchange_rates: { id: v.exchangeRatesId ?? "0xrates" },
        },
        commission_rate: v.commissionRate ?? 500,
      })),
    },
  };
}
