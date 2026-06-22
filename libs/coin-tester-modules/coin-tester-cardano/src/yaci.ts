// Lifecycle for a local Yaci DevKit Cardano devnet, driven through the `@bloxbean/yaci-devkit` CLI:
//   yaci-devkit up --enable-yaci-store   → non-interactive single-node devnet + Blockfrost-compatible store
//   yaci-devkit down                     → tear down
// `@bloxbean/yaci-devkit` is a devDependency, so the `yaci-devkit` binary resolves from node_modules/.bin
// when run via `pnpm` (locally and in CI — same pattern as the siblings' `docker-compose` devDep). Docker
// must be running — the distro manages the `bloxbean/yaci-cli` containers.
//
// Endpoints (Yaci DevKit defaults):
//   :8080/api/v1  — Yaci Store, Blockfrost-compatible indexer (reads)
//   :10000/local-cluster/api — local-cluster admin/faucet (topup, devnet reset)
import { spawn } from "node:child_process";

/** Yaci Store, Blockfrost-compatible indexer base URL (reads). */
export const YACI_STORE_API = "http://localhost:8080/api/v1";
/** local-cluster admin/faucet API base URL (topup + devnet reset). */
const YACI_ADMIN_API = "http://localhost:10000/local-cluster/api";

// Match Yaci's reference CI wait loop: poll :8080 for up to ~30 × 5s before giving up.
const READY_TIMEOUT_MS = 150_000;
const READY_POLL_MS = 5_000;

const debug = Boolean(process.env.DEBUG);
export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// The store accepts connections a few seconds before it serves data, so port-open is not enough:
// require a real latest block (the devnet is actually producing blocks) before declaring ready.
async function isStoreUp(): Promise<boolean> {
  try {
    const res = await fetch(`${YACI_STORE_API}/blocks/latest`);
    if (!res.ok) return false;
    const block = (await res.json()) as { height?: number };
    // The node reports height -1 at genesis before the socket is ready; require a produced block.
    return typeof block.height === "number" && block.height >= 0;
  } catch {
    return false;
  }
}

function runDevkit(args: string[]): ReturnType<typeof spawn> {
  return spawn("yaci-devkit", args, { stdio: debug ? "inherit" : "ignore" });
}

/** Start a single-node devnet with the Blockfrost-compatible store and wait until it is ready. */
export async function spawnYaci(): Promise<void> {
  console.log("Starting Yaci DevKit...");
  let spawnError: Error | undefined;
  const proc = runDevkit(["up", "--enable-yaci-store"]);
  // Capture (don't throw) the spawn error — throwing inside the handler is an uncaught exception;
  // it's rethrown from the loop so spawnYaci() rejects promptly and in a controlled way.
  proc.on("error", e => {
    spawnError = new Error(
      `Failed to spawn yaci-devkit (install @bloxbean/yaci-devkit and ensure Docker is running): ${e.message}`,
    );
  });

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (await isStoreUp()) {
      console.log(" -  YACI DEVKIT READY ✅  - ");
      return;
    }
    await sleep(READY_POLL_MS);
  }
  // Timed out: `up` may have partially started containers. The process-exit handlers below only
  // fire on process exit, not when the runner catches this throw — so tear down here to avoid
  // leaking a half-started devnet into the next run. killYaci never throws.
  await killYaci();
  throw new Error("Yaci DevKit did not become ready on :8080 within the timeout");
}

/** Tear down the devnet. Best-effort: `down` can exit noisily (stale PID cleanup) yet still stop the
 *  node, so teardown never throws — it would only mask the real test outcome. */
export async function killYaci(): Promise<void> {
  console.log("Stopping Yaci DevKit...");
  await new Promise<void>(resolve => {
    const proc = runDevkit(["down"]);
    proc.on("error", () => resolve());
    proc.on("exit", () => resolve());
  });
}

async function adminPost(path: string, body?: unknown): Promise<void> {
  const res = await fetch(`${YACI_ADMIN_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Yaci admin POST ${path} failed: ${res.status} ${res.statusText}`);
  }
}

/** Fund an address from the devnet faucet. `adaAmount` is whole ADA (not lovelace). */
export async function topup(address: string, adaAmount: number): Promise<void> {
  await adminPost("/addresses/topup", { address, adaAmount });
}

/** Reset the devnet to a clean state (clears the ledger between scenarios). */
export async function resetDevnet(): Promise<void> {
  await adminPost("/admin/devnet/reset");
}

export type Utxo = { amount: { unit: string; quantity: string }[] };

/** Poll the store's UTXOs for an address until `predicate` holds (or time out). Blocks accept a few
 *  seconds after submission, so callers wait on a balance/token condition rather than a fixed delay. */
export async function pollUtxos(
  address: string,
  predicate: (utxos: Utxo[]) => boolean,
): Promise<Utxo[]> {
  for (let i = 0; i < 30; i++) {
    try {
      const utxos = (await (
        await fetch(`${YACI_STORE_API}/addresses/${address}/utxos`)
      ).json()) as Utxo[];
      if (predicate(utxos)) return utxos;
    } catch {
      // Store still warming up or briefly unavailable — keep polling rather than failing fast.
    }
    await sleep(2_000);
  }
  throw new Error("pollUtxos: condition not met in time");
}

// Best-effort teardown on process exit/interruption (matches flextesa.ts/anvil.ts/agave.ts) so an
// aborted run doesn't leak a running devnet. killYaci never throws.
["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killYaci();
  }),
);
