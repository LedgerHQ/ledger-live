import network from "@ledgerhq/live-network";
import type { BitcoinCoinConfig } from "../config";
import type {
  ExplorerBalance,
  ExplorerBlock,
  ExplorerBroadcastResponse,
  ExplorerFees,
  ExplorerNetworkInfo,
  ExplorerPendingUtxos,
  ExplorerTx,
  ExplorerTxHex,
  ExplorerTxPage,
  ExplorerUtxo,
  ExplorerUtxoPage,
  TransactionSourceHeaders,
} from "./types";

/** Same default page size as the legacy explorer client. */
const DEFAULT_BATCH_SIZE = 1000;

/** Bound on UTXO pages read for one address (a million outputs at the default page size). */
const MAX_UTXO_PAGES = 1000;

type ExplorerConfig = Pick<BitcoinCoinConfig, "explorer" | "explorerId">;

/**
 * Base URL of the currency on the Ledger explorer.
 *
 * Same rule as wallet-btc's `blockchainBaseURL` (`libs/wallet-btc/src/explorer/baseUrl.ts`) fed by
 * `walletBtcCurrencyById` (`src/walletBtcCurrency.ts`): the explorer id falls back to the currency id.
 * Rebuilt from the config on every call, so a config change applies to the next request.
 */
export function explorerBaseUrl(config: ExplorerConfig, currencyId: string): string {
  return `${config.explorer.url}/blockchain/v4/${config.explorerId ?? currencyId}`;
}

/** Tags some explorer versions wrap a UTXO entry in (`{ "Pending": { … } }`, `{ "Mined": { … } }`). */
const UTXO_TAGS = ["Mined", "Pending"];

/**
 * A UTXO in the module's shape, from an explorer entry.
 *
 * - Some explorer versions wrap the entry in its kind (`{ "Pending": { … } }`); it is unwrapped.
 * - The outpoint is identified by `txId`: the explorer documents `hash` as the *witness* hash where
 *   applicable, which is not what an input references. `tx_id` and, last, `hash` are fallbacks for
 *   other explorer versions.
 * - An entry without a usable outpoint or value is an explorer error, never a UTXO with an
 *   `undefined` id.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function toUtxo(entry: unknown): ExplorerUtxo {
  if (!isRecord(entry)) {
    throw new Error(`explorer returned an unusable UTXO: ${JSON.stringify(entry)}`);
  }
  const keys = Object.keys(entry);
  const wrapped = keys.length === 1 && UTXO_TAGS.includes(keys[0]) ? entry[keys[0]] : undefined;
  const raw = isRecord(wrapped) ? wrapped : entry;
  const hash = raw.txId ?? raw.tx_id ?? raw.output_hash ?? raw.hash;
  const outputIndex = raw.outputIndex ?? raw.output_index ?? raw.vout;
  const value = raw.value;
  if (
    typeof hash !== "string" ||
    hash.length === 0 ||
    typeof outputIndex !== "number" ||
    (typeof value !== "string" && typeof value !== "number")
  ) {
    throw new Error(`explorer returned an unusable UTXO: ${JSON.stringify(entry)}`);
  }
  const hex = raw.hex ?? raw.script_hex;
  const height = raw.height ?? raw.block_height;
  return {
    hash,
    outputIndex,
    value: String(value),
    hex: typeof hex === "string" ? hex : "",
    ...(typeof height === "number" ? { height } : {}),
  };
}

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await network<T>({ method: "GET", url, params });
  return data;
}

/** Confirmed balance of an address (the explorer does not count mempool funds here). */
export async function fetchAddressBalance(
  config: ExplorerConfig,
  currencyId: string,
  address: string,
): Promise<bigint> {
  const data = await get<ExplorerBalance>(
    `${explorerBaseUrl(config, currencyId)}/address/${address}/balance`,
  );
  return BigInt(data.balance);
}

/** Every confirmed (mined) unspent output of an address, following the explorer's pagination to the last page. */
export async function fetchUtxos(
  config: ExplorerConfig,
  currencyId: string,
  address: string,
): Promise<ExplorerUtxo[]> {
  const url = `${explorerBaseUrl(config, currencyId)}/address/${address}/utxos`;
  const batchSize = config.explorer.batchSize ?? DEFAULT_BATCH_SIZE;
  const utxos: ExplorerUtxo[] = [];
  const seenTokens = new Set<string>();
  let token: string | null | undefined;
  do {
    if (seenTokens.size >= MAX_UTXO_PAGES) {
      throw new Error(`explorer returned more than ${MAX_UTXO_PAGES} pages of UTXOs`);
    }
    const page = await get<ExplorerUtxoPage>(url, {
      batch_size: batchSize,
      ...(token ? { token } : {}),
    });
    utxos.push(...(page.data ?? []).map(toUtxo));
    token = page.token;
    // A cursor seen before would page forever: the explorer is misbehaving.
    if (token && seenTokens.has(token)) {
      throw new Error("explorer repeated a UTXO page cursor");
    }
    if (token) seenTokens.add(token);
  } while (token);
  return utxos;
}

/**
 * One page of the confirmed transactions of an address. `minHeight` is a lower bound in both
 * orders (verified on the explorer); `token` is the cursor the previous page returned.
 */
export async function fetchAddressTxs(
  config: ExplorerConfig,
  currencyId: string,
  address: string,
  options: { minHeight: number; order: "asc" | "desc"; limit?: number; token?: string },
): Promise<ExplorerTxPage> {
  return get<ExplorerTxPage>(`${explorerBaseUrl(config, currencyId)}/address/${address}/txs`, {
    order: options.order === "asc" ? "ascending" : "descending",
    batch_size: options.limit ?? config.explorer.batchSize ?? DEFAULT_BATCH_SIZE,
    ...(options.minHeight > 0 ? { from_height: options.minHeight } : {}),
    ...(options.token ? { token: options.token } : {}),
  });
}

/**
 * A transaction, confirmed or not. Some explorer versions answer with a one-element array; the
 * element is returned.
 */
export async function fetchTx(
  config: ExplorerConfig,
  currencyId: string,
  txid: string,
): Promise<ExplorerTx> {
  const data = await get<ExplorerTx | ExplorerTx[]>(
    `${explorerBaseUrl(config, currencyId)}/tx/${txid}`,
  );
  const tx = Array.isArray(data) ? data[0] : data;
  if (!tx) throw new Error(`transaction ${txid} not found`);
  return tx;
}

/** Raw (serialized) transaction, hex. */
export async function fetchTxHex(
  config: ExplorerConfig,
  currencyId: string,
  txid: string,
): Promise<string> {
  const data = await get<ExplorerTxHex>(`${explorerBaseUrl(config, currencyId)}/tx/${txid}/hex`);
  return data.hex;
}

/** Outputs of an address created and spent by mempool transactions. */
export async function fetchPendingUtxos(
  config: ExplorerConfig,
  currencyId: string,
  address: string,
): Promise<ExplorerPendingUtxos> {
  const pending = await get<ExplorerPendingUtxos>(
    `${explorerBaseUrl(config, currencyId)}/address/${address}/utxos/pending`,
  );
  return {
    spent: (pending.spent ?? []).map(toUtxo),
    created: (pending.created ?? []).map(toUtxo),
  };
}

/** Fee rates (sat/kB) by confirmation target. */
export async function fetchFeeRates(
  config: ExplorerConfig,
  currencyId: string,
): Promise<ExplorerFees> {
  return get<ExplorerFees>(`${explorerBaseUrl(config, currencyId)}/fees`);
}

/** Network parameters, including the minimum relay fee. */
export async function fetchNetworkInfo(
  config: ExplorerConfig,
  currencyId: string,
): Promise<ExplorerNetworkInfo> {
  return get<ExplorerNetworkInfo>(`${explorerBaseUrl(config, currencyId)}/network`);
}

/** Current chain tip. The endpoint returns an object. */
export async function fetchCurrentBlock(
  config: ExplorerConfig,
  currencyId: string,
): Promise<ExplorerBlock> {
  return get<ExplorerBlock>(`${explorerBaseUrl(config, currencyId)}/block/current`);
}

/** Block at `height`. The endpoint returns an array; an empty one means no such block. */
export async function fetchBlock(
  config: ExplorerConfig,
  currencyId: string,
  height: number,
): Promise<ExplorerBlock> {
  const data = await get<ExplorerBlock[]>(`${explorerBaseUrl(config, currencyId)}/block/${height}`);
  const block = data[0];
  if (!block) {
    throw new Error(`block ${height} not found`);
  }
  return block;
}

/** Every transaction of the block at `height`, in a single response. */
export async function fetchBlockTxs(
  config: ExplorerConfig,
  currencyId: string,
  height: number,
): Promise<ExplorerTx[]> {
  return get<ExplorerTx[]>(`${explorerBaseUrl(config, currencyId)}/block/${height}/txs`);
}

/** Submit a signed raw transaction; returns the `result` field of the explorer response as is. */
export async function sendRawTransaction(
  config: ExplorerConfig,
  currencyId: string,
  hex: string,
  source?: TransactionSourceHeaders,
): Promise<string | null | undefined> {
  const headers: Record<string, string> = {};
  if (source) {
    headers["X-Ledger-Source-Type"] = source.type;
    headers["X-Ledger-Source-Name"] = source.name;
  }
  const { data } = await network<ExplorerBroadcastResponse, { tx: string }>({
    method: "POST",
    url: `${explorerBaseUrl(config, currencyId)}/tx/send`,
    data: { tx: hex },
    headers,
  });
  return data?.result;
}
