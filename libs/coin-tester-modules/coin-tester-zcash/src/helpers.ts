/**
 * Thin JSON-RPC client for the local `zebra` regtest node.
 *
 * zebra implements its own zcashd-compatible address-indexed RPCs natively
 * (`getaddressutxos`/`getaddresstxids`/`getaddressbalance`, confirmed present
 * in `zebra-rpc/src/methods.rs`) -- so the transparent leg needs no separate
 * indexer service; `zaino` is only required for the shielded gRPC surface
 * `@ledgerhq/zcash-utils` speaks (see `regtestNode.ts`).
 *
 * Mining is on-demand via zebra's own `generate` RPC (zcashd-compatible,
 * "only works if the network of the running zebrad process is Regtest" --
 * empirically confirmed working: internally builds a block template and
 * submits it, requiring only `disable_pow` and a configured
 * `mining.miner_address`, not `internal_miner` -- that config flag is gated
 * behind a Rust-only `internal-miner` Cargo feature that the published
 * `zfnd/zebra:latest` image is not built with, making it a silent no-op
 * (confirmed: config accepted, zero blocks ever produced after 90s+ of
 * waiting with it set to `true`).
 */
import { ZEBRA_RPC_URL } from "./regtestNode";

let nextRequestId = 0;

async function callZebraRpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const response = await fetch(ZEBRA_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "1.0",
      id: `coin-tester-zcash-${nextRequestId++}`,
      method,
      params,
    }),
  });

  const body = (await response.json()) as { result?: T; error?: { message: string } };
  if (body.error) {
    throw new Error(`zebra RPC ${method} failed: ${body.error.message}`);
  }
  return body.result as T;
}

export type ZebraUtxo = {
  address: string;
  txid: string;
  outputIndex: number;
  script: string;
  satoshis: number;
  height: number;
};

export type ZebraTransactionInput = {
  txid?: string;
  vout?: number;
  coinbase?: string;
  sequence: number;
};

export type ZebraTransactionOutput = {
  value: number;
  valueZat: number;
  n: number;
  scriptPubKey: { hex: string; addresses?: string[] };
};

export type ZebraTransactionObject = {
  txid: string;
  hex: string;
  height?: number | null;
  confirmations?: number | null;
  vin: ZebraTransactionInput[];
  vout: ZebraTransactionOutput[];
  blocktime?: number;
  time?: number;
};

export async function getBlockCount(): Promise<number> {
  return callZebraRpc<number>("getblockcount");
}

/** Mines `numBlocks` blocks immediately (zcashd-compatible `generate`, Regtest-only). */
export async function generateBlocks(numBlocks: number): Promise<string[]> {
  return callZebraRpc<string[]>("generate", [numBlocks]);
}

/**
 * Mines `numBlocks` blocks immediately, paying every coinbase reward to
 * `address` instead of the node's configured `mining.miner_address`
 * (zcashd-compatible `generatetoaddress`, Regtest-only). Used to confirm the
 * chain without crediting the test account with a fresh, immature coinbase
 * UTXO on every call -- see `regtestAddress.ts`'s `randomRegtestBurnAddress`.
 */
export async function generateBlocksToAddress(
  numBlocks: number,
  address: string,
): Promise<string[]> {
  return callZebraRpc<string[]>("generatetoaddress", [numBlocks, address]);
}

export async function getBestBlockHash(): Promise<string> {
  return callZebraRpc<string>("getbestblockhash");
}

export async function getBlock(
  hashOrHeight: string,
  verbosity = 1,
): Promise<Record<string, unknown>> {
  return callZebraRpc("getblock", [hashOrHeight, verbosity]);
}

export async function getAddressUtxos(addresses: string[]): Promise<ZebraUtxo[]> {
  return callZebraRpc<ZebraUtxo[]>("getaddressutxos", [{ addresses }]);
}

export async function getAddressTxIds(
  addresses: string[],
  start?: number,
  end?: number,
): Promise<string[]> {
  const request: { addresses: string[]; start?: number; end?: number } = { addresses };
  if (start !== undefined) request.start = start;
  if (end !== undefined) request.end = end;
  return callZebraRpc<string[]>("getaddresstxids", [request]);
}

export async function getRawTransaction(
  txid: string,
  verbose: 0 | 1 = 1,
): Promise<ZebraTransactionObject> {
  return callZebraRpc<ZebraTransactionObject>("getrawtransaction", [txid, verbose]);
}

export async function sendRawTransaction(hex: string): Promise<string> {
  return callZebraRpc<string>("sendrawtransaction", [hex]);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForBlockHeight(target: number, timeoutMs = 120_000): Promise<void> {
  const start = Date.now();
  let height = await getBlockCount();
  while (height < target) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out waiting for zebra to reach height ${target} (currently ${height})`,
      );
    }
    await sleep(1_000);
    height = await getBlockCount();
  }
}
