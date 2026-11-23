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

/** Boot the devnet; resolves once compose reports it healthy, or once a reset recovers its store. */
export async function spawnYaci(): Promise<void> {
  console.log("Starting Yaci DevKit...");
  try {
    await compose.upOne("yaci", { ...composeOpts(), commandOptions: ["--wait"] });
  } catch (error) {
    await recoverFailedBoot(error);
  }
  console.log(chalk.bgBlueBright(" -  YACI DEVKIT READY ✅  - "));
}

// Jest skips globalTeardown when globalSetup throws, so a failed boot releases the container itself.
async function releaseYaci(): Promise<void> {
  await killYaci().catch(cleanupError =>
    console.warn(`Yaci DevKit cleanup failed: ${formatComposeError(cleanupError)}`),
  );
}

const COMPOSE_UNHEALTHY_MESSAGE = "is unhealthy";

async function recoverFailedBoot(error: unknown): Promise<void> {
  const composeError = formatComposeError(error);
  // `--wait` only reports "unhealthy"; the container logs carry the actual cause.
  const logs = await yaciLogs();
  if (!composeError.includes(COMPOSE_UNHEALTHY_MESSAGE)) {
    await releaseYaci();
    throw new Error(`Yaci DevKit did not start: ${composeError}\n${logs}`, { cause: error });
  }

  console.warn(`Yaci DevKit did not become healthy (${composeError}); resetting it\n${logs}`);
  // Workaround: yaci-store can stall at genesis while the node forges; a reset restarts it.
  // See: https://github.com/bloxbean/yaci/blob/02f699b/core/src/main/java/com/bloxbean/cardano/yaci/core/protocol/Agent.java#L27-L34
  try {
    await resetDevnet();
  } catch (resetError: unknown) {
    await releaseYaci();
    const reason = resetError instanceof Error ? resetError.message : String(resetError);
    throw new Error(
      `Yaci DevKit did not become healthy: ${composeError}\nReset failed: ${reason}`,
      { cause: resetError },
    );
  }
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

export async function adminGet<T>(endpoint: string): Promise<T> {
  return withDeadline(`Yaci admin GET ${endpoint}`, ADMIN_TIMEOUT_MS, async signal => {
    const res = await fetch(`${YACI_ADMIN_API}${endpoint}`, { signal });
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`Yaci admin GET ${endpoint} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  });
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

// Each devnet suite resets and tops up in one jest hook or test next to its syncs. Worst cases (reset
// ≈ 355 s, topup ≈ 120 s) fit the 900 s jest timeout the devnet suites share.
const TOPUP_SNAPSHOT_TIMEOUT_MS = 15_000;
// The faucet answers "Topup successful" once the node accepts the tx, without waiting for it to land in
// a block (yaci-devkit 0.12.0 `LocalNodeService.topUp` ignores its own `waitForTx` result). Confirm the
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

// Reset re-runs the companion bootstrap and the store sync: 22-24 s measured on yaci-devkit 0.12.0. A
// stalled store adds the full 60 s of yaci-devkit's own wait for it, so a CI reset ran past 90 s.
const RESET_TIMEOUT_MS = 150_000;
// Reset POSTs per resetDevnet call, shared between a 5xx retry and a re-reset of a stuck chain.
const RESET_ATTEMPTS = 2;
// yaci-devkit's own waits only warn when they lapse, so a reset can answer while the store reports height
// -1. The Cardano bridge rejects a non-positive tip (`lastBlock`), and a top-up sent before forging may not
// land, so reset waits for a produced block. The store can stall at -1 while the node keeps forging (see
// `recoverFailedBoot`), so a stuck store gets one fresh reset.
const BLOCK_WAIT_TIMEOUT_MS = 20_000;
const DOCKER_OUTPUT_TIMEOUT_MS = 10_000;

// yaci-cli writes the container output; the node and the store log to files inside it. These show
// which side is stuck: the node's tip and forge traces against the store's latest block and sync log.
// Paths are those of the yaci-cli 0.10.6 image.
const IN_CONTAINER_DIAGNOSTICS = `
exec 2>&1
cd /clusters/nodes/default/node
echo "== node tip"
CARDANO_NODE_SOCKET_PATH=node.sock timeout 3 /app/cardano-bin/cardano-cli query tip --testnet-magic 42
echo "== store latest block"
curl -s -m 5 http://127.0.0.1:8080/api/v1/blocks/latest; echo
echo "== node forge traces (last 3000 lines)"
tail -n 3000 node.log | grep -oE "Trace(Forged|Adopted|NodeIsLeader|NodeNotLeader|NodeCannotForge|ForgeStateUpdateError|SlotIsImmutable|BlockFromFuture|DidntAdoptBlock|ForgedInvalidBlock|NoLedgerState|NoLedgerView)[A-Za-z]*" | sort | uniq -c
echo "== node log"
grep -vE "Debug|InboundGovernor|ConnectionManager|PublicRootPeers|LocalRootPeers|PeerSelection|Mempool" node.log | tail -n 40
for f in /app/store/logs/*.log; do
  [ -f "$f" ] || continue
  echo "== store log $f"
  grep -vE " DEBUG |ClassPathScanner|RootClass|Hibernate" "$f" | tail -n 60
done
echo "== yaci-cli log"
tail -n 40 /app/logs/yaci-cli.log
echo "== resources"
uptime; free -m; df -h /
`;

// `docker <args>` in the package folder; resolves to its output (or why it is missing), never rejects.
function dockerOutput(label: string, args: string[]): Promise<string> {
  return new Promise(resolve => {
    // `execFile` rather than `docker-compose`, which cannot cancel its child: the timeout kills a hung
    // docker command instead of leaking it.
    execFile(
      "docker",
      args,
      {
        cwd: PACKAGE_ROOT,
        env: process.env,
        timeout: DOCKER_OUTPUT_TIMEOUT_MS,
        killSignal: "SIGKILL",
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const streams = composeStreams({ out: String(stdout), err: String(stderr) });
        resolve(error ? `(${label} unavailable: ${error.message})\n${streams}` : streams);
      },
    );
  });
}

// The devnet container's output, then its node and store logs; never rejects.
async function yaciLogs(): Promise<string> {
  const [output, internals] = await Promise.all([
    dockerOutput("container logs", [
      "compose",
      "logs",
      "--no-color",
      "--timestamps",
      "--tail",
      "200",
      "yaci",
    ]),
    dockerOutput("container internals", [
      "compose",
      "exec",
      "-T",
      "yaci",
      "sh",
      "-c",
      IN_CONTAINER_DIAGNOSTICS,
    ]),
  ]);
  return `${output}\n${internals}`;
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
      if (!failure.retryable || last) {
        throw new Error(`${failure.error.message}\nContainer logs:\n${await yaciLogs()}`, {
          cause: failure.error,
        });
      }
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
