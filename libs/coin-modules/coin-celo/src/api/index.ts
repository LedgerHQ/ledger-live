import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type {
  Balance,
  BroadcastConfig,
  BufferTxData,
  CoinModuleApi,
  CoinModuleImpl,
  Cursor,
  FeeEstimation,
  MemoNotSupported,
  Page,
  TransactionIntent,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
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

type CeloContext = Context<EvmConfigInfo>;

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
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives — including `stakingSupported`, which is not part of the API surface.
//
// `craftRawTransaction` is the one capability neither this module nor the EVM api it composes
// provides, so it is absent here; the consumer resolver applies `withDefaults`, which answers
// "not supported" for it. `register` is likewise left to the wrapper rather than stubbed.
export function createApi(currencyId = "celo") {
  const evmApi = createEvmApi(currencyId);

  // Bridge the gap between the built lib's MemoNotSupported-typed evmApi and the real v6
  // EvmConfigInfo-typed authoring shape; the cast is needed because coin-evm is consumed through
  // its build output here, and it names the authoring type since that is what createApi returns.
  // `validateIntent` is spelled out as required because this module delegates to it for every
  // non-staking intent: coin-evm implements it, and a future change dropping it must break here
  // rather than at runtime.
  const typedEvmApi = evmApi as unknown as CoinModuleImpl<
    EvmConfigInfo,
    MemoNotSupported,
    BufferTxData
  > &
    Required<Pick<CoinModuleApi<EvmConfigInfo, MemoNotSupported, BufferTxData>, "validateIntent">>;

  const api = {
    ...typedEvmApi,
    craftTransaction: (
      _context: CeloContext,
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      options?: { customFees?: FeeEstimation },
    ) => craftTransaction(intent, options?.customFees),
    estimateFees: (
      _context: CeloContext,
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      _options?: { feeOption?: unknown },
    ) => estimateFees(intent),
    combine: (_context: CeloContext, tx: string, signature: string[], _options?) =>
      combine(tx, signature),
    broadcast: (
      _context: CeloContext,
      tx: string,
      _options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> =>
      getCeloClient().sendRawTransaction({ serializedTransaction: prefixHex(tx) }),
    // Surface staking positions via `getBalance().stake`; native/token balance still comes from coin-evm.
    getBalance: makeGetBalance((_context: CeloContext, address: string, options) =>
      typedEvmApi.getBalance(_context, address, options),
    ),
    getStakes: (_context: CeloContext, address: string, _options?: { cursor?: Cursor }) =>
      getStakes(address),
    getRewards: (_context: CeloContext, address: string, _options?: { cursor?: Cursor }) =>
      getRewards(address),
    getValidators: (
      _context: CeloContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => getValidators(),
    stakingSupported: true,
    validateIntent: (
      context: CeloContext,
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ) =>
      isCeloStakingIntent(intent)
        ? validateStakingIntent(intent, balances, options?.customFees)
        : typedEvmApi.validateIntent(context, intent, balances, options),
  } satisfies CoinModuleImpl<EvmConfigInfo, MemoNotSupported, BufferTxData> & {
    stakingSupported?: boolean;
  };

  return api;
}

export default createApi;
