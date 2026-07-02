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

const prefixHex = (hex: string): `0x${string}` =>
  (hex.startsWith("0x") ? hex : `0x${hex}`) as `0x${string}`;

/**
 * Celo CoinModuleApi.
 *
 * Celo is an EVM chain, so the generic methods (balance, operations, blocks,
 * sequence, address validation) are delegated to `@ledgerhq/coin-evm`'s api.
 * The methods that must understand Celo's CIP-64 fee abstraction (gas paid in an
 * ERC-20) and its `viem/celo` serialization are overridden: `craftTransaction`,
 * `estimateFees`, `combine`, `broadcast`.
 *
 * Staking is implemented on Celo's real LockedGold + Election validator-group
 * model (not coin-evm's governance-delegation shim): `getStakes`/`getValidators`
 * read live positions and groups, and staking transactions are crafted via the
 * `celo.*` intent operations. `getRewards` is not supported (Celo has no discrete
 * on-chain reward events). `validateIntent` handles staking intents and delegates
 * the rest to coin-evm.
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
    // Surface Celo staking positions via `getBalance().stake` (what the
    // generic-coin-framework reads) while still delegating native/token balance
    // fetching to coin-evm.
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
