import { execFile } from "child_process";
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

const composeStreams = ({ out, err }: Partial<IDockerComposeResult>) =>
  [err?.trim(), out?.trim()].filter(Boolean).join("\n");

// `docker-compose` rejects with a plain `{ exitCode, out, err }`, not an Error, so
// `String(error)` would yield "[object Object]" and hide the real docker message.
function formatComposeError(error: unknown): string {
  if (error instanceof Error) return error.message;

  const result = (error ?? {}) as Partial<IDockerComposeResult>;
  return `exit code ${result.exitCode ?? "unknown"}\n${composeStreams(result)}`;
}

/** Boot the devnet; resolves once the healthcheck sees a produced block. */
export async function spawnYaci(): Promise<void> {
  console.log("Starting Yaci DevKit...");
  try {
    await compose.upOne("yaci", { ...composeOpts(), commandOptions: ["--wait"] });
  } catch (error) {
    // `--wait` only reports "unhealthy"; the container logs carry the actual cause.
    const logs = await yaciLogs();
    // Jest skips globalTeardown when globalSetup throws, so release the container here.
    await killYaci().catch(cleanupError =>
      console.warn(`Yaci DevKit cleanup failed: ${formatComposeError(cleanupError)}`),
    );
    throw new Error(`Yaci DevKit did not become healthy: ${formatComposeError(error)}\n${logs}`, {
      cause: error,
    });
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

type AdminPostFailure = { error: Error; retryable: boolean };

/**
 * One admin POST; resolves to its failure, or `undefined` on 2xx. A 5xx is retryable: the server
 * finished handling the request. A timeout or transport error is retryable only with
 * `retryTransportErrors`: the request may still be running server-side.
 */
async function adminPostOnce(
  endpoint: string,
  body: unknown,
  timeoutMs: number,
  retryTransportErrors: boolean,
): Promise<AdminPostFailure | undefined> {
  try {
    const status = await withDeadline(`Yaci admin POST ${endpoint}`, timeoutMs, async signal => {
      const res = await fetch(`${YACI_ADMIN_API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
      await res.body?.cancel(); // body is unused on every path; release the socket for reuse (undici)
      return { ok: res.ok, code: res.status, text: res.statusText };
    });
    if (status.ok) return undefined;
    return {
      error: new Error(`Yaci admin POST ${endpoint} failed: ${status.code} ${status.text}`),
      retryable: status.code >= 500,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e : new Error(String(e)),
      retryable: retryTransportErrors,
    };
  }
}

async function adminPost(endpoint: string, body: unknown): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    const failure = await adminPostOnce(endpoint, body, ADMIN_TIMEOUT_MS, true);
    if (!failure) return;
    if (!failure.retryable || attempt >= ADMIN_RETRY_LIMIT) throw failure.error;
    console.warn(
      `Yaci admin POST ${endpoint} attempt ${attempt} failed (${failure.error.message}); retrying`,
    );
    await sleep(ADMIN_RETRY_DELAY_MS);
  }
}

const STORE_TIMEOUT_MS = 2_000;
const STORE_POLL_INTERVAL_MS = 500;

/** GET a yaci-store JSON resource; `undefined` while the store is unreachable or answers non-2xx. */
export async function storeGet<T>(path: string, notFound?: T): Promise<T | undefined> {
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
// to fit their own sync (negativeCases allows 310 s). Worst cases that go on to top-up and sync, with
// ~2.5 s poll overshoot per wait: reset ≈ 2×45 (POSTs) + 2×22.5 (block waits) + 10 (logs) ≈ 145 s,
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
// 7-15 s, past ADMIN_TIMEOUT_MS, so it gets its own bound.
const RESET_TIMEOUT_MS = 45_000;
// Reset POSTs per resetDevnet call, shared between a 5xx retry and a re-reset of a stuck chain.
const RESET_ATTEMPTS = 2;
// yaci-devkit 0.10.6 answers the reset without waiting for a block (`ClusterCommands.startLocalCluster`
// skips `waitForNextBlocks` on a first run), so the store reports height -1 until the node forges. The
// Cardano bridge rejects a non-positive tip (`lastBlock`), and a top-up sent before forging may not
// land, so reset waits for a produced block. The first block normally lands ~2 s after the reset
// answers. CI has seen a reset leave the chain at -1 past a 30 s wait while a later reset in the same
// run worked, so a stuck chain gets one fresh reset.
const BLOCK_WAIT_TIMEOUT_MS = 20_000;
const LOGS_TIMEOUT_MS = 10_000;

/**
 * Tail of the devnet container's output; never rejects. Uses `execFile` rather than `docker-compose`,
 * which cannot cancel its child: the timeout kills a hung `docker compose logs` instead of leaking it.
 */
function yaciLogs(): Promise<string> {
  return new Promise(resolve => {
    execFile(
      "docker",
      ["compose", "logs", "--no-color", "--tail", "200", "yaci"],
      {
        cwd: PACKAGE_ROOT,
        env: process.env,
        timeout: LOGS_TIMEOUT_MS,
        killSignal: "SIGKILL",
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const streams = composeStreams({ out: String(stdout), err: String(stderr) });
        resolve(error ? `(container logs unavailable: ${error.message})\n${streams}` : streams);
      },
    );
  });
}

/** Reset the devnet ledger to a clean state; resolves once the reset chain produces blocks again. */
export async function resetDevnet(): Promise<void> {
  const resetPath = "/admin/devnet/reset";
  for (let attempt = 1; ; attempt++) {
    const last = attempt >= RESET_ATTEMPTS;
    // No re-send after a timeout or transport error: that reset may still be running server-side. A 2xx
    // reset has finished (the endpoint runs stop, wipe and start before it answers), so a stuck chain
    // can take a fresh one.
    const failure = await adminPostOnce(resetPath, undefined, RESET_TIMEOUT_MS, false);
    if (failure) {
      if (!failure.retryable || last) throw failure.error;
      console.warn(
        `Yaci admin POST ${resetPath} attempt ${attempt} failed (${failure.error.message}); retrying`,
      );
      await sleep(ADMIN_RETRY_DELAY_MS);
      continue;
    }

    let height: number | undefined;
    const stuck = await pollUntil(
      BLOCK_WAIT_TIMEOUT_MS,
      async () => {
        height = (await storeGet<{ height?: unknown }>("/blocks/latest"))?.height as
          | number
          | undefined;
        return typeof height === "number" && height > 0 ? height : undefined;
      },
      () =>
        `Yaci devnet produced no block within ${BLOCK_WAIT_TIMEOUT_MS}ms after reset attempt ${attempt} (last height: ${height ?? "unavailable"})`,
    ).then(
      () => undefined,
      (error: Error) => error.message,
    );
    if (stuck === undefined) return;

    const logs = await yaciLogs();
    if (last) throw new Error(`${stuck}\nContainer logs:\n${logs}`);
    console.warn(`${stuck}; resetting again\nContainer logs:\n${logs}`);
  }
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

// Best-effort teardown on exit/interrupt (matches flextesa/agave) so an aborted run doesn't leak.
["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killYaci().catch(() => {});
  }),
);
