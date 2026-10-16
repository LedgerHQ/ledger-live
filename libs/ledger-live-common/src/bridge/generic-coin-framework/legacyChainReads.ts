import { toJsonSafe } from "@ledgerhq/account-module-framework";
import type { OptionalApiKey } from "@ledgerhq/coin-module-framework/api/index";
import type {
  AccountInfo,
  CallParams,
  CoinModuleApi,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { ChainReads, TransactionInfo } from "@ledgerhq/ledger-wallet-framework/api/types";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";

/**
 * Coin module capabilities beyond coin-module-framework's `CoinModuleApi`, as the legacy path reads
 * them: `supports` is the one `withDefaults` attaches, the others are extra members a module may
 * carry (coin-hedera's address lookup). Mirrors portfolio-module-local's `CoinModuleExtensions`.
 */
export type ChainReadsCoinModule = CoinModuleApi<any, any, any> & {
  supports?: (method: string) => boolean;
  getAddressesForPublicKey?: (context: Context<any>, publicKey: string) => Promise<string[]>;
  getTransactionInfo?: (
    context: Context<any>,
    hash: string,
  ) => Promise<TransactionInfo | undefined>;
};

/**
 * The chain reads of the legacy path: the coin module's, overridden by the reads the family makes
 * beyond it (`legacy`, its `legacyChainReads`). A read the coin module lacks rejects with
 * `ChainReadUnsupportedError`, and so does a capability of its contract it does not support
 * (`supports`, which knows only those: an extra member is served when present). `getAccountInfo`
 * answers `{ type: "none" }` then, as ADR-045 has it. `getAccountInfo` is read once per address and
 * answered in its JSON form, as the portfolio path answers it.
 */
export function coinModuleChainReads(
  api: ChainReadsCoinModule,
  context: Context<any>,
  legacy: Partial<ChainReads> = {},
): ChainReads {
  const served = async <A extends unknown[], R>(
    name: string,
    method: ((context: Context<any>, ...args: A) => Promise<R>) | undefined,
    supported: boolean,
    ...args: A
  ): Promise<R> => {
    if (!method || !supported) {
      throw new ChainReadUnsupportedError(`${name} is not supported by the coin module`);
    }
    return method.call(api, context, ...args);
  };
  /** A capability of the coin module contract, as `withDefaults` tells it. */
  const capability = (name: OptionalApiKey): boolean => api.supports?.(name) !== false;

  const reads: ChainReads = {
    getAccountInfo: async address =>
      (await api.getAccountInfo?.(context, address)) ?? { type: "none" },
    call: params => served("call", api.call, capability("call"), params as CallParams),
    getNextSequence: address =>
      served("getNextSequence", api.getNextSequence, capability("getNextSequence"), address),
    getAddressesForPublicKey: publicKey =>
      served("getAddressesForPublicKey", api.getAddressesForPublicKey, true, publicKey),
    getTransactionInfo: hash => served("getTransactionInfo", api.getTransactionInfo, true, hash),
    ...legacy,
  };

  const accountInfos = new Map<string, Promise<AccountInfo>>();
  return {
    ...reads,
    getAccountInfo: address => {
      let info = accountInfos.get(address);
      if (!info) {
        info = reads.getAccountInfo(address).then(value => toJsonSafe(value) as AccountInfo);
        accountInfos.set(address, info);
      }
      return info;
    },
  };
}

/** The chain reads of a currency served by the legacy path. */
export async function legacyChainReadsFor(currency: CryptoCurrency): Promise<ChainReads> {
  const [api, bridgeApi] = await Promise.all([
    getCoinModuleApi(currency.id, "local"),
    getBridgeApi(currency, currency.family),
  ]);
  const context = buildContext(currency.id);
  return coinModuleChainReads(api, context, bridgeApi.legacyChainReads?.(currency, api, context));
}
