/**
 * Bridges the wallet's Ledger-explorer (`blockchain/v4/<explorerId>`) HTTP
 * calls to the local `zebra` node's own JSON-RPC, mirroring
 * `coin-tester-evm`'s MSW-bridges-to-local-node pattern (`indexer.ts:1006-1012`'s
 * `onUnhandledRequest` guard) rather than running a separate explorer service:
 * zebra already indexes addresses natively (see `helpers.ts`).
 *
 * `EXPLORER` is pointed at `EXPLORER_ORIGIN` (see `scenarii/zcash.ts`'s setup)
 * so every request this package answers is guaranteed local; the
 * `onUnhandledRequest` guard registered by `startIndexer` still throws on any
 * request to a non-localhost host, as a second line of defense.
 */
import { setupServer, type SetupServerApi } from "msw/node";
import { http, HttpResponse } from "msw";
import type { TX, Input, Output } from "@ledgerhq/wallet-btc/index";
import {
  getAddressTxIds,
  getBlock,
  getBlockCount,
  getRawTransaction,
  sendRawTransaction,
  type ZebraTransactionInput,
  type ZebraTransactionOutput,
} from "./helpers";
import { fromRegtestAddress, toRegtestAddress } from "./regtestAddress";

export const EXPLORER_ORIGIN = "http://127.0.0.1:9877";
export const EXPLORER_ID = "zcash_regtest";
export const EXPLORER_BASE = `${EXPLORER_ORIGIN}/blockchain/v4/${EXPLORER_ID}`;

type ZebraBlock = { hash: string; time: number; height: number };

async function blockAt(hashOrHeight: string): Promise<ZebraBlock> {
  return (await getBlock(hashOrHeight, 1)) as unknown as ZebraBlock;
}

function toIsoTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

// zebra's RPC responses embed addresses encoded for its own configured
// network (Regtest) -- convert back to the mainnet encoding coin-zcash's
// classifier expects before these reach the wallet.
function regtestScriptPubKeyAddress(scriptPubKey: { addresses?: string[] }): string | undefined {
  const address = scriptPubKey.addresses?.[0];
  return address === undefined ? undefined : fromRegtestAddress(address);
}

async function resolveInput(vin: ZebraTransactionInput): Promise<Input> {
  if (vin.coinbase !== undefined || vin.txid === undefined || vin.vout === undefined) {
    return { value: "0", output_index: 0, sequence: vin.sequence };
  }
  const prevTx = await getRawTransaction(vin.txid, 1);
  const prevOut = prevTx.vout[vin.vout];
  return {
    value: String(prevOut.valueZat),
    address: regtestScriptPubKeyAddress(prevOut.scriptPubKey),
    output_hash: vin.txid,
    output_index: vin.vout,
    sequence: vin.sequence,
  };
}

function toOutput(vout: ZebraTransactionOutput, txid: string, blockHeight: number | null): Output {
  return {
    value: String(vout.valueZat),
    address: regtestScriptPubKeyAddress(vout.scriptPubKey) ?? "unknown",
    output_hash: txid,
    output_index: vout.n,
    block_height: blockHeight,
    rbf: false, // overwritten by wallet-btc's own hydrateTx from the inputs' sequence
  };
}

async function mapTx(txid: string): Promise<TX> {
  const raw = await getRawTransaction(txid, 1);
  const inputs = await Promise.all(raw.vin.map(resolveInput));
  const isCoinbase = raw.vin.some(vin => vin.coinbase !== undefined);
  const blockHeight = raw.height ?? null;
  const outputs = raw.vout.map(vout => toOutput(vout, raw.txid, blockHeight));

  const fees = isCoinbase
    ? 0
    : inputs.reduce((sum, input) => sum + Number(input.value), 0) -
      outputs.reduce((sum, output) => sum + Number(output.value), 0);

  let block: TX["block"] = null;
  let receivedAt = new Date().toISOString();
  if (blockHeight !== null && blockHeight >= 0) {
    const blockData = await blockAt(String(blockHeight));
    block = { height: blockHeight, hash: blockData.hash, time: toIsoTime(blockData.time) };
    receivedAt = block.time;
  }

  return {
    id: raw.txid,
    account: 0,
    index: 0,
    received_at: receivedAt,
    block,
    address: "",
    inputs,
    outputs,
    fees,
  };
}

function buildHandlers() {
  return [
    http.get(`${EXPLORER_BASE}/block/current`, async () => {
      const height = await getBlockCount();
      const blockData = await blockAt(String(height));
      return HttpResponse.json({ height, hash: blockData.hash, time: toIsoTime(blockData.time) });
    }),
    http.get(`${EXPLORER_BASE}/block/:height`, async ({ params }) => {
      const height = Number(params.height);
      const blockData = await blockAt(String(height));
      return HttpResponse.json([{ height, hash: blockData.hash, time: toIsoTime(blockData.time) }]);
    }),
    http.get(`${EXPLORER_BASE}/address/:address/txs`, async ({ params }) => {
      const address = params.address as string;
      const txids = await getAddressTxIds([toRegtestAddress(address)]);
      const txs = await Promise.all(txids.map(mapTx));
      return HttpResponse.json({ data: txs, token: null });
    }),
    http.get(`${EXPLORER_BASE}/address/:address/txs/pending`, async () => {
      return HttpResponse.json([]);
    }),
    http.get(`${EXPLORER_BASE}/tx/:hash/hex`, async ({ params }) => {
      const raw = await getRawTransaction(params.hash as string, 1);
      return HttpResponse.json({ hex: raw.hex });
    }),
    http.get(`${EXPLORER_BASE}/tx/:hash`, async ({ params }) => {
      const tx = await mapTx(params.hash as string);
      return HttpResponse.json(tx);
    }),
    http.post(`${EXPLORER_BASE}/tx/send`, async ({ request }) => {
      const { tx } = (await request.json()) as { tx: string };
      const result = await sendRawTransaction(tx);
      return HttpResponse.json({ data: { result } });
    }),
    http.get(`${EXPLORER_BASE}/fees`, async () =>
      HttpResponse.json({ "1": 1_000, "2": 1_000, "3": 1_000 }),
    ),
    http.get(`${EXPLORER_BASE}/network`, async () => HttpResponse.json({})),
  ];
}

let server: SetupServerApi | undefined;

export function startIndexer(): void {
  server = setupServer(...buildHandlers());
  server.listen({
    onUnhandledRequest: request => {
      const hostname = new URL(request.url).hostname;
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });
}

export function stopIndexer(): void {
  server?.close();
  server = undefined;
}
