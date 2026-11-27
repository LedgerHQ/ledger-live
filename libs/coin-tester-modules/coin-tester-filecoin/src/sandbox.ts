import { setEnv } from "@ledgerhq/live-env";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { sandboxVersions } from "@ledgerhq/coin-tester/versions";

// The Lotus RPC of the coin-sandbox instance, known once it is up
let nodeUrl: string | undefined;

type RpcResponse<T> = { result?: T; error?: { code: number; message: string } };

type MessageLookup = { Receipt: { ExitCode: number } };

function getNodeUrl(): string {
  if (nodeUrl === undefined) throw new Error("the Lotus RPC is not set: is the sandbox up?");

  return nodeUrl;
}

export async function startFilecoinSandbox(): Promise<Sandbox> {
  const sandbox = await startSandbox(
    { family: "filecoin", network: "filecoin" },
    sandboxVersions("filecoin"),
  );
  const { node, indexer } = sandbox.endpoints;
  // The caller never gets the handle when this throws, so the instance is removed here
  if (node === undefined || indexer === undefined) {
    await sandbox.down();
    throw new Error(
      `the sandbox instance has no ${node === undefined ? "node" : "indexer"} endpoint`,
    );
  }

  nodeUrl = node;
  // coin-filecoin appends the API version to this base itself
  setEnv("API_FILECOIN_ENDPOINT", indexer);
  return sandbox;
}

/** The URL of the sandbox indexer, as the coin module reaches it. */
export function indexerUrl(sandbox: Sandbox): string {
  const { indexer } = sandbox.endpoints;
  if (indexer === undefined) throw new Error("the sandbox instance has no indexer endpoint");

  return indexer;
}

// The longest call is `StateWaitMsg`, which returns a few tipsets (4 s each) after a broadcast: a node
// that stops producing them fails here, with the method's name, instead of at the jest timeout
const RPC_TIMEOUT_MS = 2 * 60 * 1000;

/** A read-only JSON-RPC call to the node. */
export async function lotus<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(getNodeUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  }).catch((e: unknown) => {
    throw new Error(`${method}: ${e instanceof Error ? e.message : String(e)}`);
  });
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status} ${await res.text()}`);
  const body = (await res.json()) as RpcResponse<T>;
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  if (body.result === undefined) throw new Error(`${method}: the node answered with no result`);

  return body.result;
}

/**
 * Blocks until the node has executed the message and `confidence` tipsets sit on top of it, which
 * is when the indexer lists it: no polling loop on the scenario side.
 */
export async function waitForMessage(cid: string, confidence = 1): Promise<void> {
  const lookup = await lotus<MessageLookup>("Filecoin.StateWaitMsg", [
    { "/": cid },
    confidence,
    -1,
    true,
  ]);
  if (lookup.Receipt.ExitCode !== 0) {
    throw new Error(`message ${cid} failed with exit code ${lookup.Receipt.ExitCode}`);
  }
}

/**
 * The ID-masked EVM address of an account: `0xff`, 11 zero bytes and the actor id. The ERC-20
 * balance of a native account is keyed by it, since the account has no EVM address of its own.
 */
export async function evmAddressOf(address: string): Promise<string> {
  const idAddress = await lotus<string>("Filecoin.StateLookupID", [address, null]);
  const id = /^[a-z]0(\d+)$/.exec(idAddress)?.[1];
  if (id === undefined) throw new Error(`${address} resolved to ${idAddress}, not an ID address`);

  return `0xff${"00".repeat(11)}${BigInt(id).toString(16).padStart(16, "0")}`;
}

type ChainMessage = { GasFeeCap: string; GasLimit: number };

/** The most a message can cost: the fee cap times the gas limit it reserves, before the refund. */
export async function reservedGas(cid: string): Promise<bigint> {
  const message = await lotus<ChainMessage>("Filecoin.ChainGetMessage", [{ "/": cid }]);
  return BigInt(message.GasFeeCap) * BigInt(message.GasLimit);
}
