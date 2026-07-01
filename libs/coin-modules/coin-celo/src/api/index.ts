import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import type { EvmCoinConfig, EvmConfig } from "@ledgerhq/coin-evm/config";
import type {
  BroadcastConfig,
  BufferTxData,
  CoinModuleApi,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCeloClient } from "../network/client";
import { combine } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";

const prefixHex = (hex: string): `0x${string}` =>
  (hex.startsWith("0x") ? hex : `0x${hex}`) as `0x${string}`;

const stakingNotSupported =
  (method: string) =>
  (): never => {
    throw new Error(
      `celo: ${method} is not supported — staking is not implemented in the CoinModuleApi (see src/api/STAKING.md)`,
    );
  };

/**
 * Celo CoinModuleApi.
 *
 * Celo is an EVM chain, so the generic methods (balance, operations, blocks,
 * sequence, address/intent validation) are delegated to `@ledgerhq/coin-evm`'s
 * api. Only the methods that must understand Celo's CIP-64 fee abstraction (gas
 * paid in an ERC-20) and its `viem/celo` serialization are overridden:
 * `craftTransaction`, `estimateFees`, `combine`, and `broadcast`.
 *
 * Staking is intentionally NOT exposed (see `src/api/STAKING.md`): coin-evm
 * advertises EVM-staking support for Celo, so `getStakes`/`getRewards`/
 * `getValidators` are forced to throw and the `stakingSupported` flag is stripped.
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
    getStakes: stakingNotSupported("getStakes"),
    getRewards: stakingNotSupported("getRewards"),
    getValidators: stakingNotSupported("getValidators"),
  };

  delete (api as { stakingSupported?: boolean }).stakingSupported;

  return api;
}

export default createApi;
