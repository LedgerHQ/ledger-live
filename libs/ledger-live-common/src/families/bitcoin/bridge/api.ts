import { FeeEstimationFailed } from "../../../errors";
import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { BitcoinTxData } from "@ledgerhq/coin-bitcoin/logic/intent";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { blockchainBaseURL } from "@ledgerhq/coin-bitcoin/explorer";
import { makeLRUCacheWithTtlOf } from "@ledgerhq/coin-bitcoin/cache";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { DEFAULT_FEE_RATES_CACHE_TTL_MS } from "@ledgerhq/coin-bitcoin/constants";
import { bitcoinPickingStrategy } from "@ledgerhq/coin-bitcoin/types";
import { getBitcoinCoinConfig } from "../coinConfig";
import type { FeeItems } from "../types";

type Fees = Record<string, number>;

const cachedEstimatedFees = makeLRUCacheWithTtlOf(
  async (currency: CryptoCurrency, config: BitcoinCoinConfig): Promise<Fees> => {
    const baseURL = blockchainBaseURL(currency, config);
    invariant(baseURL, `Fees for ${currency.id} are not supported`);
    const { data, status } = await network<Fees>({
      method: "GET",
      url: `${baseURL}/fees`,
    });

    if (data) {
      return data;
    }

    throw new FeeEstimationFailed(`FeeEstimationFailed ${status}`, {
      httpStatus: status,
    });
  },
  // Keyed by the explorer base URL (it carries the currency's explorer id), so a remote change of
  // `explorer.url` or `explorerId` fetches from the new endpoint.
  (currency, config) => blockchainBaseURL(currency, config),
  (_currency, config) => config.fees?.feeRatesCacheTtlMs ?? DEFAULT_FEE_RATES_CACHE_TTL_MS,
);

const getEstimatedFees = (currency: CryptoCurrency): Promise<Fees> =>
  cachedEstimatedFees(currency, getBitcoinCoinConfig(currency.id));

export const speeds = new Map([
  [1, "fast"],
  [3, "medium"],
  [6, "slow"],
]);

export const defaultBlockCount = 3;

/**
 * Returns the current network fee rate(fast, medium, slow) from our backend for a given currency
 */
export const getFeeItems = async (currency: CryptoCurrency): Promise<FeeItems> => {
  const all: Array<{
    key: string;
    speed: string;
    blockCount: number;
    feePerByte: BigNumber;
  }> = [];
  const fees = await getEstimatedFees(currency);
  let defaultFeePerByte = new BigNumber(0);

  for (const key of Object.keys(fees)) {
    const feePerByte = new BigNumber(Math.ceil(fees[key] / 1000));
    const blockCount = parseInt(key, 10);
    if (blockCount === defaultBlockCount) defaultFeePerByte = feePerByte;

    if (!Number.isNaN(blockCount) && !feePerByte.isNaN() && speeds.has(blockCount)) {
      all.push({
        key,
        speed: speeds.get(blockCount)!,
        blockCount,
        feePerByte,
      });
    }
  }

  const items = all
    .sort((a, b) => a.blockCount - b.blockCount)
    .map(({ key, speed, feePerByte }) => ({
      key,
      speed,
      feePerByte,
    }));
  return {
    items,
    defaultFeePerByte,
  };
};

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === "string");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

type CoinControl = NonNullable<BitcoinTxData["utxoStrategy"]>;
type UtxoStrategyName = NonNullable<CoinControl["strategy"]>;

// The legacy bridge's picking strategies. `CUSTOM` is what the coin-control screen sets once the
// user unticks a UTXO: wallet-btc's `Custom` picks deepest first.
const LEGACY_STRATEGIES: Record<number, UtxoStrategyName> = {
  [bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST]: "deep-outputs-first",
  [bitcoinPickingStrategy.OPTIMIZE_SIZE]: "optimize-size",
  [bitcoinPickingStrategy.MERGE_OUTPUTS]: "merge-outputs",
  [bitcoinPickingStrategy.CUSTOM]: "deep-outputs-first",
};

// A strategy name is passed on as is: the coin module refuses one it does not know.
const isStrategyName = (value: unknown): value is UtxoStrategyName => typeof value === "string";

function strategyOf(strategy: unknown): UtxoStrategyName | undefined {
  if (isStrategyName(strategy)) return strategy;
  if (typeof strategy === "number") return LEGACY_STRATEGIES[strategy];
  return undefined;
}

// A legacy exclusion `{ hash, outputIndex }` as the `txid:vout` id the coin module reads.
function legacyUtxoId(entry: unknown): string | undefined {
  if (!isRecord(entry)) return undefined;
  const { hash, outputIndex } = entry;
  if (typeof hash !== "string" || typeof outputIndex !== "number") return undefined;
  if (!Number.isInteger(outputIndex) || outputIndex < 0) return undefined;
  return `${hash}:${outputIndex}`;
}

// Both shapes reach the bridge: the coin module's (a strategy name, `excludedUtxos`) and the legacy
// transaction's (a strategy number, `excludeUTXOs`). Exclusions are merged without duplicates, since
// the module refuses an id listed twice. A ticked UTXO stays a candidate the strategy picks from:
// the legacy screen never maps to `selectedUtxos`, which spends every listed UTXO.
function coinControlOf(utxoStrategy: unknown): CoinControl | undefined {
  if (!isRecord(utxoStrategy)) return undefined;
  const { strategy, selectedUtxos, excludedUtxos, excludeUTXOs } = utxoStrategy;

  const control: CoinControl = {};
  const name = strategyOf(strategy);
  if (name) control.strategy = name;
  if (isStringList(selectedUtxos)) control.selectedUtxos = selectedUtxos;

  const excluded = new Set(isStringList(excludedUtxos) ? excludedUtxos : []);
  if (Array.isArray(excludeUTXOs)) {
    for (const entry of excludeUTXOs) {
      const id = legacyUtxoId(entry);
      if (id) excluded.add(id);
    }
  }
  if (excluded.size > 0) control.excludedUtxos = [...excluded];

  return Object.keys(control).length > 0 ? control : undefined;
}

// The generic bridge calls this instead of the coin module's `craftTransactionData`, so it carries
// everything that one carried (the OP_RETURN data) plus the coin control the module reads from
// `intent.data`. A value of the wrong type is dropped; the module reports what it cannot parse.
export function buildIntentData(transaction: Record<string, unknown>): BitcoinTxData {
  const data: BitcoinTxData = { type: "unknown" };

  // The legacy transaction holds the OP_RETURN data as a Buffer, the intent as hex.
  const { opReturnData, utxoStrategy } = transaction;
  if (Buffer.isBuffer(opReturnData)) {
    if (opReturnData.length > 0) data.opReturnData = opReturnData.toString("hex");
  } else if (typeof opReturnData === "string" && opReturnData !== "") {
    data.opReturnData = opReturnData;
  }

  const control = coinControlOf(utxoStrategy);
  if (control) data.utxoStrategy = control;

  return data;
}

export default function bitcoinBridge(_currency: CryptoCurrency): BridgeApi {
  return { buildIntentData };
}
