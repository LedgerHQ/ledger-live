import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import type { EvmCoinConfig, EvmConfig } from "@ledgerhq/coin-evm/config";
import type {
  Balance,
  BroadcastConfig,
  BufferTxData,
  CoinModuleApi,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCeloClient } from "../network/client";
import { combine } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";
import { makeGetBalance } from "./getBalance";
import { getRewards } from "./getRewards";
import { getStakes } from "./getStakes";
import { getValidators } from "./getValidators";
import { isCeloStakingIntent } from "./stakingIntent";
import { validateStakingIntent } from "./validateStakingIntent";

// Re-exported so consumers wiring Celo into the generic coin framework (e.g. the
// family bridge's `computeIntentType`) can type the mode → operation mapping
// against the same source of truth instead of bare string literals.
export type { CeloStakingType } from "./stakingIntent";

const prefixHex = (hex: string): `0x${string}` =>
  (hex.startsWith("0x") ? hex : `0x${hex}`) as `0x${string}`;

/**
 * Celo CoinModuleApi. Celo is an EVM chain, so generic methods delegate to
 * `@ledgerhq/coin-evm`; the CIP-64/`viem/celo`-sensitive methods are overridden
 * (`craftTransaction`, `estimateFees`, `combine`, `broadcast`). Staking uses
 * Celo's real LockedGold + Election model (not coin-evm's governance shim):
 * `getStakes`/`getValidators` read live state, staking is crafted via `celo.*`
 * intents, `getRewards` is unsupported (no discrete on-chain reward events), and
 * `validateIntent` handles staking then delegates the rest to coin-evm.
 */
export function createApi(
  config: EvmConfig | (() => EvmCoinConfig),
  currencyId = "celo",
): CoinModuleApi<MemoNotSupported, BufferTxData> {
  const evmApi = createEvmApi(config, currencyId);

  const api = {
    ...evmApi,
    craftTransaction,
    estimateFees,
    combine,
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig): Promise<string> =>
      getCeloClient().sendRawTransaction({ serializedTransaction: prefixHex(tx) }),
    // Surface staking positions via `getBalance().stake`; native/token balance still comes from coin-evm.
    getBalance: makeGetBalance((address: string, options) => evmApi.getBalance(address, options)),
    getStakes,
    getRewards,
    getValidators,
    stakingSupported: true,
    validateIntent: (
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ) =>
      isCeloStakingIntent(intent)
        ? validateStakingIntent(intent, balances, customFees)
        : evmApi.validateIntent(intent, balances, customFees),
  };

  return api;
}

export default createApi;
