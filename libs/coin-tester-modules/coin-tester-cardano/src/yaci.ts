import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";
import type { IDockerComposeResult } from "docker-compose";

export const YACI_STORE_API = "http://localhost:8080/api/v1";
const YACI_ADMIN_API = "http://localhost:10000/local-cluster/api";

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const composeOpts = () => ({
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
});

// `docker-compose` rejects with a plain `{ exitCode, out, err }`, not an Error, so
// `String(error)` would yield "[object Object]" and hide the real docker message.
function formatComposeError(error: unknown): string {
  if (error instanceof Error) return error.message;

  const { exitCode, out, err } = (error ?? {}) as Partial<IDockerComposeResult>;
  const streams = [err?.trim(), out?.trim()].filter(Boolean).join("\n");
  return `exit code ${exitCode ?? "unknown"}\n${streams}`;
}

/** Boot the devnet; resolves once the healthcheck sees a produced block. */
export async function spawnYaci(): Promise<void> {
  console.log("Starting Yaci DevKit...");
  try {
    await compose.upOne("yaci", { ...composeOpts(), commandOptions: ["--wait"] });
  } catch (error) {
    // `--wait` only reports "unhealthy"; the container logs carry the actual cause.
    const { out: logs } = await compose
      .logs("yaci", { ...composeOpts(), commandOptions: ["--tail", "200"] })
      .catch(() => ({ out: "" }));
    // Jest skips globalTeardown when globalSetup throws, so release the container here.
    await killYaci().catch(cleanupError =>
      console.warn(`Yaci DevKit cleanup failed: ${formatComposeError(cleanupError)}`),
    );
    throw new Error(`Yaci DevKit did not become healthy: ${formatComposeError(error)}\n${logs}`);
  }
  console.log(chalk.bgBlueBright(" -  YACI DEVKIT READY ✅  - "));
}

export async function killYaci(): Promise<void> {
  console.log("Stopping Yaci DevKit...");
  await compose.down({ ...composeOpts(), commandOptions: ["--remove-orphans", "--volumes"] });
}

// The faucet/admin API can transiently 5xx right after boot. Retry transient failures (5xx / network);
// fail fast on 4xx.
const ADMIN_RETRY_LIMIT = 5;
const ADMIN_RETRY_DELAY_MS = 1_000;
const ADMIN_TIMEOUT_MS = 10_000;

// Wall-clock bound independent of AbortSignal: MSW's passthrough can silently swallow a request's
// AbortSignal, so a stalled request would otherwise hang forever. Race the whole exchange, body
// included, against a timer that rejects regardless (the abandoned work settles on its own); the signal
// still cancels the socket when it does fire.
async function withDeadline<T>(
  label: string,
  timeoutMs: number,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([work(AbortSignal.timeout(timeoutMs)), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

type AdminPostOptions = {
  timeoutMs?: number;
  attempts?: number;
  // Off for a request that must not be re-sent while it may still be running server-side: after a
  // timeout or transport error the first attempt can still be in flight. An HTTP 5xx means the server
  // finished handling it, so that stays retryable.
  retryTransportErrors?: boolean;
};

async function adminPost(
  path: string,
  body?: unknown,
  {
    timeoutMs = ADMIN_TIMEOUT_MS,
    attempts = ADMIN_RETRY_LIMIT,
    retryTransportErrors = true,
  }: AdminPostOptions = {},
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    let retryable = false;
    let error: Error;
    try {
      const status = await withDeadline(`Yaci admin POST ${path}`, timeoutMs, async signal => {
        const res = await fetch(`${YACI_ADMIN_API}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal,
        });
        await res.body?.cancel(); // body is unused on every path; release the socket for reuse (undici)
        return { ok: res.ok, code: res.status, text: res.statusText };
      });
      if (status.ok) return;
      error = new Error(`Yaci admin POST ${path} failed: ${status.code} ${status.text}`);
      retryable = status.code >= 500;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      retryable = retryTransportErrors;
    }
    if (!retryable || attempt >= attempts) throw error;
    console.warn(`Yaci admin POST ${path} attempt ${attempt} failed (${error.message}); retrying`);
    await sleep(ADMIN_RETRY_DELAY_MS);
  }
}

const STORE_TIMEOUT_MS = 2_000;
const STORE_POLL_INTERVAL_MS = 500;

/** GET a yaci-store JSON resource; `undefined` while the store is unreachable or answers non-2xx. */
async function storeGet<T>(path: string, notFound?: T): Promise<T | undefined> {
  try {
    return await withDeadline(`Yaci store GET ${path}`, STORE_TIMEOUT_MS, async signal => {
      const res = await fetch(`${YACI_STORE_API}${path}`, { signal });
      if (res.status === 404 && notFound !== undefined) {
        await res.body?.cancel();
        return notFound;
      }
      if (!res.ok) {
        await res.body?.cancel();
        return undefined;
      }
      return (await res.json()) as T;
    });
  } catch {
    return undefined; // store starting or restarting
  }
}

/** Poll `probe` until it returns a value, or throw `timeoutMessage(last)` after `timeoutMs`. */
async function pollUntil<T>(
  timeoutMs: number,
  probe: () => Promise<T | undefined>,
  timeoutMessage: () => string,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await probe();
    if (value !== undefined) return value;
    await sleep(STORE_POLL_INTERVAL_MS);
  }
  throw new Error(timeoutMessage());
}

type StoreUtxo = {
  tx_hash: string;
  output_index: number;
  amount: { unit: string; quantity: string }[];
};

const utxoRef = (u: StoreUtxo) => `${u.tx_hash}#${u.output_index}`;

// Suites call resetDevnet() then topup() inside one hook bounded by jest's 600 s ceiling, which also has
// to fit their own sync (negativeCases allows 310 s). Worst cases below: reset ≈ 2×45 + 1 + 30 ≈ 124 s,
// topup ≈ 15 + 54 (adminPost: 5×10 s + 4×1 s) + 45 ≈ 120 s. Measured needs are a fraction of that:
// reset 7-15 s, first block ~2 s later, top-up confirmed in ~1 s.
const TOPUP_SNAPSHOT_TIMEOUT_MS = 15_000;
// The faucet answers "Topup successful" once the node accepts the tx, without waiting for it to land in
// a block (yaci-devkit 0.10.6 `LocalNodeService.topUp` ignores its own `waitForTx` result). Confirm the
// funding UTXO here so a lost top-up fails at its source rather than as a later sync/poll timeout.
const TOPUP_CONFIRM_TIMEOUT_MS = 45_000;

/** Fund an address from the faucet; `adaAmount` is whole ADA (not lovelace). Resolves once funded. */
export async function topup(address: string, adaAmount: number): Promise<void> {
  const utxosPath = `/addresses/${address}/utxos`;
  const before = await pollUntil(
    TOPUP_SNAPSHOT_TIMEOUT_MS,
    () => storeGet<StoreUtxo[]>(utxosPath, []),
    () => `Yaci store did not serve UTXOs for ${address}`,
  );
  const known = new Set(before.map(utxoRef));
  const lovelace = String(Math.round(adaAmount * 1_000_000));

  await adminPost("/addresses/topup", { address, adaAmount });

  await pollUntil(
    TOPUP_CONFIRM_TIMEOUT_MS,
    async () => {
      const utxos = await storeGet<StoreUtxo[]>(utxosPath, []);
      return utxos?.find(
        u =>
          !known.has(utxoRef(u)) &&
          u.amount.some(a => a.unit === "lovelace" && a.quantity === lovelace),
      );
    },
    () =>
      `Yaci top-up of ${adaAmount} ADA to ${address} not confirmed within ${TOPUP_CONFIRM_TIMEOUT_MS}ms`,
  );
}

// Reset stops the node and store, drops their data and starts a new chain from genesis. It answers in
// 7-15 s, past ADMIN_TIMEOUT_MS, so it gets its own bound and a single 5xx retry.
const RESET_TIMEOUT_MS = 45_000;
const RESET_ATTEMPTS = 2;
// yaci-devkit 0.10.6 answers the reset without waiting for a block (`ClusterCommands.startLocalCluster`
// skips `waitForNextBlocks` on a first run), so the store reports height -1 until the node forges. The
// Cardano bridge rejects a non-positive tip (`lastBlock`), and a top-up sent before forging may not
// land, so reset waits for a produced block.
const BLOCK_WAIT_TIMEOUT_MS = 30_000;

/** Reset the devnet ledger to a clean state; resolves once the reset chain produces blocks again. */
export async function resetDevnet(): Promise<void> {
  await adminPost("/admin/devnet/reset", undefined, {
    timeoutMs: RESET_TIMEOUT_MS,
    attempts: RESET_ATTEMPTS,
    retryTransportErrors: false,
  });

  let height: number | undefined;
  await pollUntil(
    BLOCK_WAIT_TIMEOUT_MS,
    async () => {
      height = (await storeGet<{ height?: unknown }>("/blocks/latest"))?.height as
        | number
        | undefined;
      return typeof height === "number" && height > 0 ? height : undefined;
    },
    () =>
      `Yaci devnet produced no block within ${BLOCK_WAIT_TIMEOUT_MS}ms after reset (last height: ${height ?? "unavailable"})`,
  );
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
        await fetch(`${YACI_STORE_API}/addresses/${address}/utxos`, {
          signal: AbortSignal.timeout(2_000),
        })
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
["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killYaci().catch(() => {});
  }),
);
