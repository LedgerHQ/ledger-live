import type { CoinModuleApi, FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";

export type TezosFeeParameters = {
  gasLimit: bigint;
  storageLimit: bigint;
  amount?: bigint;
  txFee?: bigint;
};
export type TezosFeeEstimation = FeeEstimation & {
  parameters?: TezosFeeParameters & Record<string, unknown>;
};

export type TezosSender = { address: string; xpub?: string };

/**
 * Network-specific account metadata for Tezos (ADR-045 shape).
 * `revealed` is `true` once the account has published its public key on-chain.
 */
export type TezosAccountInfo = { type: "tezos"; revealed: boolean };

/**
 * coin-tezos public API surface: the generic {@link CoinModuleApi} plus `getAccountInfo`,
 * which exposes the account's on-chain reveal state.
 *
 * Kept local (rather than relying on the future framework-side reveal-state type from ADR-045)
 * so coin-tezos does not depend on that framework change landing first. The `{ type: "tezos" }`
 * shape is intentionally identical to the ADR-045 variant. Once the framework's `CoinModuleApi`
 * ships its own `getAccountInfo`, migrating means dropping this local override entirely (the two
 * signatures would otherwise intersect into an incompatible-return-type collision) and letting the
 * implementation satisfy the generic method directly.
 */
export type TezosApi = CoinModuleApi & {
  getAccountInfo: (address: string) => Promise<TezosAccountInfo>;
};
