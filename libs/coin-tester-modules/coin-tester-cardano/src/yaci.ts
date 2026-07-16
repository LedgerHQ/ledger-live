// Local Yaci DevKit Cardano devnet via the `@bloxbean/yaci-devkit` CLI. Runs native host processes under
// `~/.yaci-cli/` (NOT Docker); `down` doesn't reliably reap them — hence the reap + port-free wait in
// killYaci. Endpoints: :8080 store (reads), :10000 admin/faucet.
import { spawn } from "node:child_process";

export const YACI_STORE_API = "http://localhost:8080/api/v1";
const YACI_ADMIN_API = "http://localhost:10000/local-cluster/api";

// Generous ceiling: a cold `up` downloads components + cold-starts the node before serving a block.
const READY_TIMEOUT_MS = 300_000;
const READY_POLL_MS = 5_000;
const PORT_FREE_TIMEOUT_MS = 20_000;

const debug = Boolean(process.env.DEBUG);
export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Ready = a produced block on :8080 (port-open precedes data). AbortSignal bounds each poll so a hung
// socket can't stall the loop past READY_TIMEOUT_MS.
async function isStoreUp(): Promise<boolean> {
  try {
    const res = await fetch(`${YACI_STORE_API}/blocks/latest`, {
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) return false;
    const block = (await res.json()) as { height?: number };
    // height -1 at genesis; require a produced block.
    return typeof block.height === "number" && block.height >= 0;
  } catch {
    return false;
  }
}

// Run a yaci-devkit subcommand; when `capture` is given (non-DEBUG), tee stdout/stderr into it (ring
// buffer) so a startup timeout is diagnosable from CI logs.
function runDevkit(args: string[], capture?: string[]): ReturnType<typeof spawn> {
  const proc = spawn("yaci-devkit", args, {
    stdio: debug ? "inherit" : capture ? ["ignore", "pipe", "pipe"] : "ignore",
  });
  if (capture && !debug) {
    const onData = (d: Buffer) => {
      capture.push(d.toString());
      if (capture.length > 400) capture.splice(0, capture.length - 400);
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
  }
  return proc;
}

// Free = ECONNREFUSED (store gone). AbortSignal bounds the probe; any other error (timeout / hung
// socket) counts as still-in-use so killYaci's loop can't stall.
async function isPortFree(): Promise<boolean> {
  try {
    await fetch(`${YACI_STORE_API}/blocks/latest`, { signal: AbortSignal.timeout(2_000) });
    return false;
  } catch (e) {
    return (e as { cause?: { code?: string } })?.cause?.code === "ECONNREFUSED";
  }
}

// `down` doesn't reliably reap the native host processes; SIGKILL any `yaci-cli` survivor so the next
// `up` can bind :8080. Never throws (a "nothing matched" exit is expected).
function reapYaciProcesses(): Promise<void> {
  return new Promise<void>(resolve => {
    const proc = spawn("pkill", ["-9", "-f", "yaci-cli"], { stdio: "ignore" });
    proc.on("error", () => resolve());
    proc.on("exit", () => resolve());
  });
}

/** Boot the devnet and wait until the store is ready. */
export async function spawnYaci(): Promise<void> {
  console.log("Starting Yaci DevKit...");
  // Clean slate: a leaked devnet still holding :8080 would make this `up` fail to bind (the CI flake).
  await killYaci();

  let spawnError: Error | undefined;
  const output: string[] = [];
  const proc = runDevkit(["up", "--enable-yaci-store"], output);
  // Capture, don't throw (throwing in the handler = uncaught); rethrown from the loop below.
  proc.on("error", e => {
    spawnError = new Error(
      `Failed to spawn yaci-devkit (install @bloxbean/yaci-devkit): ${e.message}`,
    );
  });
  // Non-zero exit before readiness = `up` failed; fail fast instead of polling to READY_TIMEOUT_MS.
  // Exit 0 is fine (background launch: the devnet keeps running).
  proc.on("exit", code => {
    if (code != null && code !== 0) {
      if (!debug && output.length > 0) {
        console.error("yaci-devkit up failed. Last devkit output:\n" + output.join(""));
      }
      spawnError = new Error(`yaci-devkit up exited with code ${code} before the store was ready`);
    }
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
  // Timed out: dump captured output for CI, then tear down (exit handlers only fire on process exit).
  if (!debug && output.length > 0) {
    console.error("Yaci DevKit startup timed out. Last devkit output:\n" + output.join(""));
  }
  await killYaci();
  throw new Error("Yaci DevKit did not become ready on :8080 within the timeout");
}

/** Tear down the devnet — best-effort, never throws: `down`, then SIGKILL survivors and wait for :8080
 *  to free so a later spawnYaci doesn't race a half-dead devnet. */
export async function killYaci(): Promise<void> {
  console.log("Stopping Yaci DevKit...");
  await new Promise<void>(resolve => {
    const proc = runDevkit(["down"]);
    proc.on("error", () => resolve());
    proc.on("exit", () => resolve());
  });
  await reapYaciProcesses();
  const deadline = Date.now() + PORT_FREE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isPortFree()) return;
    await sleep(1_000);
  }
  console.warn(`Yaci DevKit: :8080 still in use ${PORT_FREE_TIMEOUT_MS}ms after teardown`);
}

// The faucet/admin API can transiently 5xx right after boot. Retry transient failures (5xx / network);
// fail fast on 4xx. AbortSignal bounds each attempt.
const ADMIN_RETRY_LIMIT = 5;
const ADMIN_RETRY_DELAY_MS = 1_000;

async function adminPost(path: string, body?: unknown): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    let retryable = false;
    let error: Error;
    try {
      const res = await fetch(`${YACI_ADMIN_API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return;
      error = new Error(`Yaci admin POST ${path} failed: ${res.status} ${res.statusText}`);
      retryable = res.status >= 500;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      retryable = true;
    }
    if (!retryable || attempt >= ADMIN_RETRY_LIMIT) throw error;
    console.warn(`Yaci admin POST ${path} attempt ${attempt} failed (${error.message}); retrying`);
    await sleep(ADMIN_RETRY_DELAY_MS);
  }
}

/** Fund an address from the faucet; `adaAmount` is whole ADA (not lovelace). */
export async function topup(address: string, adaAmount: number): Promise<void> {
  await adminPost("/addresses/topup", { address, adaAmount });
}

/** Reset the devnet ledger to a clean state. */
export async function resetDevnet(): Promise<void> {
  await adminPost("/admin/devnet/reset");
}

export type Utxo = { amount: { unit: string; quantity: string }[] };

/** Poll the store's UTXOs for `address` until `predicate` holds (blocks land a few seconds after submit). */
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
      // Store warming up; keep polling.
    }
    await sleep(2_000);
  }
  throw new Error("pollUtxos: condition not met in time");
}

// Best-effort teardown on exit/interrupt (matches flextesa/anvil/agave) so an aborted run doesn't leak.
["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killYaci();
  }),
);
