import network from "@ledgerhq/live-network/network";
import type { TransactionSource } from "@ledgerhq/coin-module-framework/api/types";
import { DEFAULT_EXPLORER_BATCH_SIZE, DEFAULT_FEE_RATES_CACHE_TTL_MS } from "../constants";
import type {
  ExplorerBlock,
  ExplorerFees,
  ExplorerNetwork,
  ExplorerTx,
  ExplorerTxsPage,
  ExplorerUtxoTx,
} from "./types";

const EXPLORER_VERSION = "v4";

export type ExplorerTarget = {
  /** Ledger explorer endpoint, e.g. https://explorers.api.live.ledger.com */
  endpoint: string;
  /** Ledger explorer id, e.g. "btc" */
  explorerId: string;
  /** Transactions requested per page. @default DEFAULT_EXPLORER_BATCH_SIZE */
  batchSize?: number | undefined;
  /** Lifetime of the fee rates read from this explorer. @default DEFAULT_FEE_RATES_CACHE_TTL_MS */
  feeRatesCacheTtlMs?: number | undefined;
};

export const explorerBaseUrl = ({ endpoint, explorerId }: ExplorerTarget): string =>
  `${endpoint}/blockchain/${EXPLORER_VERSION}/${explorerId}`;

export type AddressTxsParams = {
  fromHeight?: number;
  toHeight?: number;
  batchSize?: number;
  token?: string;
  order?: "ascending" | "descending";
};

/**
 * Stateless client of the Ledger explorer v4. Every read is per address or per transaction: the
 * explorer has no account (xpub) endpoint, account-wide views are built by the caller.
 */
export const explorer = (target: ExplorerTarget) => {
  const baseUrl = explorerBaseUrl(target);

  return {
    baseUrl,
    batchSize: target.batchSize ?? DEFAULT_EXPLORER_BATCH_SIZE,
    feeRatesCacheTtlMs: target.feeRatesCacheTtlMs ?? DEFAULT_FEE_RATES_CACHE_TTL_MS,

    async getCurrentBlock(): Promise<ExplorerBlock> {
      const { data } = await network<ExplorerBlock>({
        method: "GET",
        url: `${baseUrl}/block/current`,
      });
      return { height: data.height, hash: data.hash, time: data.time };
    },

    async getBlockByHeight(height: number): Promise<ExplorerBlock | null> {
      const { data } = await network<ExplorerBlock[]>({
        method: "GET",
        url: `${baseUrl}/block/${height}`,
      });
      const block = data[0];
      return block ? { height: block.height, hash: block.hash, time: block.time } : null;
    },

    async getFees(): Promise<ExplorerFees> {
      const { data } = await network<ExplorerFees>({ method: "GET", url: `${baseUrl}/fees` });
      return data;
    },

    async getNetwork(): Promise<ExplorerNetwork> {
      const { data } = await network<ExplorerNetwork>({ method: "GET", url: `${baseUrl}/network` });
      return data;
    },

    async getTxHex(txid: string): Promise<string> {
      const { data } = await network<{ hex: string }>({
        method: "GET",
        url: `${baseUrl}/tx/${txid}/hex`,
      });
      return data.hex;
    },

    async getUtxoTx(txid: string): Promise<ExplorerUtxoTx> {
      const { data } = await network<ExplorerUtxoTx>({
        method: "GET",
        url: `${baseUrl}/tx/${txid}`,
        params: { verbosity: "Minimal" },
      });
      return data;
    },

    async getAddressTxs(address: string, params: AddressTxsParams): Promise<ExplorerTxsPage> {
      const { data } = await network<ExplorerTxsPage>({
        method: "GET",
        url: `${baseUrl}/address/${address}/txs`,
        params: {
          verbosity: "Minimal",
          ...(params.batchSize === undefined ? {} : { batch_size: params.batchSize }),
          ...(params.fromHeight === undefined ? {} : { from_height: params.fromHeight }),
          ...(params.toHeight === undefined ? {} : { to_height: params.toHeight }),
          ...(params.order === undefined ? {} : { order: params.order }),
          ...(params.token === undefined ? {} : { token: params.token }),
        },
      });
      return { data: data.data ?? [], token: data.token ?? null };
    },

    async getAddressPendingTxs(address: string, batchSize: number): Promise<ExplorerTx[]> {
      const { data } = await network<ExplorerTx[]>({
        method: "GET",
        url: `${baseUrl}/address/${address}/txs/pending`,
        params: { verbosity: "Minimal", batch_size: batchSize },
      });
      return data ?? [];
    },

    async broadcast(tx: string, source?: TransactionSource): Promise<string> {
      const headers: Record<string, string> = {};
      if (source) {
        headers["X-Ledger-Source-Type"] = source.type;
        headers["X-Ledger-Source-Name"] = source.name;
      }
      const { data } = await network<{ result: string }>({
        method: "POST",
        url: `${baseUrl}/tx/send`,
        data: { tx },
        headers,
      });
      return data.result;
    },
  };
};

export type Explorer = ReturnType<typeof explorer>;
