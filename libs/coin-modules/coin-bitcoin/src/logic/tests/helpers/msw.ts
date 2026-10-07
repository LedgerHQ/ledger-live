import { setNetworkState } from "@ledgerhq/live-network";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { setupServer } from "msw/node";
import type { BitcoinCoinConfig, BitcoinContext } from "../../../config";
import type { ExplorerBlock, ExplorerTx } from "../../../network/types";

/** Host every MSW handler answers on; the context below points the explorer at it. */
export const TEST_EXPLORER = "https://explorer.test";

export const server = setupServer();

/**
 * Starts the shared server for the calling suite. Any request without a handler fails the test,
 * which is what proves the network layer only talks to the mocked endpoints.
 */
export function useMswServer(): void {
  beforeAll(() => {
    // No retry on 5xx: an explorer error must surface on the first answer.
    setNetworkState({ getCallsRetry: 0 });
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

const DEFAULT_CONFIG: BitcoinCoinConfig = {
  status: { type: "active" },
  name: "Bitcoin",
  unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
  explorer: { url: TEST_EXPLORER },
  explorerId: "btc",
};

/** A {@link BitcoinContext} whose config targets {@link TEST_EXPLORER}. */
export function testContext(overrides: Partial<BitcoinCoinConfig> = {}): BitcoinContext {
  return {
    config: async () => ({ ...DEFAULT_CONFIG, ...overrides }),
    logger: () => {},
  };
}

/** Base URL of an explorer id on {@link TEST_EXPLORER}. */
export const explorerUrl = (explorerId = "btc") => `${TEST_EXPLORER}/blockchain/v4/${explorerId}`;

export const balanceHandler = (address: string, balance: string, explorerId?: string) =>
  http.get(`${explorerUrl(explorerId)}/address/${address}/balance`, () =>
    HttpResponse.json({ address, balance }),
  );

export const currentBlockHandler = (block: ExplorerBlock) =>
  http.get(`${explorerUrl()}/block/current`, () => HttpResponse.json(block));

export const blockHandler = (height: number, blocks: ExplorerBlock[]) =>
  http.get(`${explorerUrl()}/block/${height}`, () => HttpResponse.json(blocks));

export const blockTxsHandler = (height: number, txs: ExplorerTx[]) =>
  http.get(`${explorerUrl()}/block/${height}/txs`, () => HttpResponse.json(txs));

/**
 * Rejection body the Ledger explorer returns from `POST tx/send` (HTTP 400) for a transaction the
 * node cannot decode, as observed on mainnet with garbage hex.
 */
export const BROADCAST_REJECTION = {
  status: 400,
  body: {
    code: 102,
    class: "RPCFailure",
    message: "TX decode failed. Make sure the tx has at least one input. (-22) (102)",
    context: {
      code: "102",
      message: "TX decode failed. Make sure the tx has at least one input. (-22)",
    },
  },
};

/** Explorer 404 body for an unknown resource. */
export const notFound = (what: string) =>
  HttpResponse.json(
    { code: 100, class: "NotFound", message: `Not found: ${what}`, context: { what } },
    { status: 404 },
  );

export function makeTx(hash: string, opts: Partial<Omit<ExplorerTx, "hash">> = {}): ExplorerTx {
  return { hash, fees: "0", block: null, inputs: [], outputs: [], ...opts };
}

export function makeBlock(height: number, opts: Partial<ExplorerBlock> = {}): ExplorerBlock {
  return {
    hash: "ab".repeat(32),
    height,
    time: "2009-04-06T03:23:33Z",
    txs: [],
    ...opts,
  };
}

export const utxosHandler = (
  address: string,
  pages: { data: JsonBodyType[]; token: string | null }[],
  explorerId?: string,
) =>
  http.get(`${explorerUrl(explorerId)}/address/${address}/utxos`, ({ request }) => {
    const token = new URL(request.url).searchParams.get("token");
    const index = token ? Number(token) : 0;
    return HttpResponse.json(pages[index] ?? { data: [], token: null });
  });

/** Fee rates in sat/kB by confirmation target, as the explorer publishes them. */
export const feesHandler = (fees: Record<string, number>, explorerId?: string) =>
  http.get(`${explorerUrl(explorerId)}/fees`, () =>
    HttpResponse.json({ ...fees, last_updated: 1790949312 }),
  );

export const networkHandler = (relayFee: string | null = "0.00001", explorerId?: string) =>
  http.get(`${explorerUrl(explorerId)}/network`, () =>
    HttpResponse.json({ relay_fee: relayFee, incremental_fee: "0.00001" }),
  );

export const pendingUtxosHandler = (
  address: string,
  pending: { spent?: JsonBodyType[]; created?: JsonBodyType[] } = {},
  explorerId?: string,
) =>
  http.get(`${explorerUrl(explorerId)}/address/${address}/utxos/pending`, () =>
    HttpResponse.json({ spent: pending.spent ?? [], created: pending.created ?? [] }),
  );

/** A transaction as `tx/{hash}` returns it: one spending `spends` (outpoints `txid:vout`). */
export const txHandler = (txid: string, spends: string[], explorerId?: string) =>
  http.get(`${explorerUrl(explorerId)}/tx/${txid}`, () =>
    HttpResponse.json({
      id: txid,
      hash: txid,
      fees: "1000",
      block: null,
      inputs: spends.map(spent => {
        const [outputTxId, outputIndex] = spent.split(":");
        return {
          output_tx_id: outputTxId,
          output_hash: outputTxId,
          output_index: Number(outputIndex),
          value: "1",
        };
      }),
      outputs: [],
    }),
  );
