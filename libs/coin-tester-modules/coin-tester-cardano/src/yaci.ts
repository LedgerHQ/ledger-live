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
// AbortSignal, so a stalled admin POST would otherwise hang forever. Race the fetch against a timer that
// rejects regardless (the abandoned fetch settles on its own); the signal still cancels the socket when
// it does fire.
function adminFetch(path: string, init: RequestInit): Promise<Response> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Yaci admin POST ${path} timed out after ${ADMIN_TIMEOUT_MS}ms`)),
      ADMIN_TIMEOUT_MS,
    );
  });
  return Promise.race([fetch(`${YACI_ADMIN_API}${path}`, init), timeout]).finally(() =>
    clearTimeout(timer),
  );
}

async function adminPost(path: string, body?: unknown): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    let retryable = false;
    let error: Error;
    try {
      const res = await adminFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
      });
      await res.body?.cancel(); // body is unused on every path; release the socket for reuse (undici)
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
