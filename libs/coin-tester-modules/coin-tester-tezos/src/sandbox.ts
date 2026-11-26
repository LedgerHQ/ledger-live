import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { sandboxVersions } from "@ledgerhq/coin-tester/versions";

const SANDBOX_SERVER = process.env.COIN_SANDBOX_URL ?? "http://localhost:8000";
const POLL_MS = 500;

/** The instance runs an Octez node and TzKT, the explorer the module reads. */
export function startTezosSandbox(): Promise<Sandbox> {
  return startSandbox({ family: "tezos", network: "tezos" }, sandboxVersions("tezos"));
}

/** The URL the sandbox gave one of the instance's services: `node` or `indexer`. */
export function endpointOf(sandbox: Sandbox, name: "node" | "indexer"): string {
  const url = sandbox.endpoints[name];
  if (url === undefined) throw new Error(`the sandbox instance has no ${name} endpoint`);
  return url;
}

export const BAKERS_URL = new URL("/tezos/tezos/validators", SANDBOX_SERVER).href;

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`GET ${url}: ${response.status}`);
  return (await response.json()) as T;
}

export async function bakerAddresses(): Promise<string[]> {
  const bakers = await getJson<{ address: string }[]>(`${BAKERS_URL}/v3/bakers`);
  return bakers.map(baker => baker.address);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Waits until TzKT lists the operation `hash`: the module syncs from TzKT, which follows the node a
 * moment later. Every request stops at the deadline, body reads included.
 */
export async function waitForIndexedOperation(
  indexer: string,
  hash: string,
  timeoutMs = 60_000,
): Promise<void> {
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    for (;;) {
      const operations = await getJson<unknown[]>(`${indexer}/v1/operations/${hash}`, signal);
      if (operations.length > 0) return;
      await sleep(POLL_MS);
    }
  } catch (error) {
    if (!signal.aborted) throw error;
    throw new Error(`TzKT did not list ${hash} within ${timeoutMs / 1000} s`, { cause: error });
  }
}
