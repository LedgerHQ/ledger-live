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

  if (typeof utxoStrategy === "object" && utxoStrategy !== null) {
    const { strategy, selectedUtxos, excludedUtxos } = utxoStrategy as Record<string, unknown>;
    const control: NonNullable<BitcoinTxData["utxoStrategy"]> = {};
    if (typeof strategy === "string") {
      control.strategy = strategy as NonNullable<BitcoinTxData["utxoStrategy"]>["strategy"];
    }
    if (isStringList(selectedUtxos)) control.selectedUtxos = selectedUtxos;
    if (isStringList(excludedUtxos)) control.excludedUtxos = excludedUtxos;
    if (Object.keys(control).length > 0) data.utxoStrategy = control;
  }

  return data;
}

export default function bitcoinBridge(_currency: CryptoCurrency): BridgeApi {
  return { buildIntentData };
}
