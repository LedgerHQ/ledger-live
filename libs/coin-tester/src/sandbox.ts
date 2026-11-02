/**
 * What a coin tester needs from coin-sandbox, the service that starts the nodes and indexers a
 * scenario runs against. The family, the network and the params are opaque here: coin-sandbox
 * validates them.
 */

import { constants } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";

const DEFAULT_URL = "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 2000; // when the server gives no Retry-After
const DOWN_TIMEOUT_MS = 2 * 60 * 1000;
const STATUSES = ["starting", "up", "unhealthy", "failed"];
const SIGNALS: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

export type SandboxTarget = { family: string; network: string };

export type SandboxInstance = SandboxTarget & {
  instance: string;
  status: "starting" | "up" | "unhealthy" | "failed";
  endpoints?: Record<string, string>;
  software?: string;
  image?: string;
  error?: string;
};

export type SandboxUpOptions = { timeoutMs?: number; intervalMs?: number };

// Instances this client started, removed on exit signals
const started = new Map<string, SandboxInstance>();
let signalsHooked = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every(v => typeof v === "string");
}

function isInstance(value: unknown): value is SandboxInstance {
  return (
    isRecord(value) &&
    typeof value.instance === "string" &&
    typeof value.family === "string" &&
    typeof value.network === "string" &&
    typeof value.status === "string" &&
    STATUSES.includes(value.status) &&
    (value.endpoints === undefined || isStringRecord(value.endpoints))
  );
}

async function request(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ status: number; headers: Headers; body: unknown }> {
  const base = process.env.COIN_SANDBOX_URL ?? DEFAULT_URL;
  try {
    const response = await fetch(new URL(path, base), {
      method,
      body: body && JSON.stringify(body),
      signal,
    });
    const json: unknown = await response.json().catch(() => undefined);
    signal?.throwIfAborted();
    if (!response.ok) {
      const reason = isRecord(json) && typeof json.error === "string" ? json.error : "";
      throw new Error(`coin-sandbox ${method} ${path}: ${response.status} ${reason}`.trim());
    }
    return { status: response.status, headers: response.headers, body: json };
  } catch (error) {
    if (signal?.aborted) throw new Error(`coin-sandbox ${method} ${path}: timed out`);
    throw error;
  }
}

function hookSignals(): void {
  if (signalsHooked) return;
  signalsHooked = true;
  for (const signal of SIGNALS) {
    process.once(signal, async () => {
      await downAll();
      process.exit(128 + constants.signals[signal]);
    });
  }
}

// Reads the status monitor `up` pointed to, every `intervalMs`, until the instance is up
async function waitUntilUp(
  monitorUrl: string,
  intervalMs: number,
  signal: AbortSignal,
): Promise<SandboxInstance> {
  for (;;) {
    const { body: current } = await request(monitorUrl, "GET", undefined, signal);
    if (!isInstance(current)) {
      throw new Error(`coin-sandbox ${monitorUrl}: unexpected answer ${JSON.stringify(current)}`);
    }
    const { instance } = current;
    if (current.status === "up") return current;
    if (current.status === "failed") {
      throw new Error(`coin-sandbox instance ${instance} failed: ${current.error ?? "no reason"}`);
    }
    // Wakes at once when the startup deadline passes: the next request then fails as timed out
    await sleep(intervalMs, undefined, { signal }).catch(() => undefined);
  }
}

// Where to read the instance (the `Location` of a 202) and how often: `Retry-After` (seconds)
function monitorOf(headers: Headers, options: SandboxUpOptions): [string, number] {
  const location = headers.get("location");
  if (location === null) throw new Error("coin-sandbox up: the 202 has no Location to monitor");
  const retryAfter = Number(headers.get("retry-after"));
  const intervalMs =
    options.intervalMs ?? (retryAfter > 0 ? retryAfter * 1000 : DEFAULT_INTERVAL_MS);
  return [location, intervalMs];
}

/** A running instance, kept here so the scenario never handles its id. */
export type Sandbox = {
  endpoints: Record<string, string>;
  /** Funds `address` with `amount` whole units of the native coin, or of the token `contractAddress`. */
  airdrop: (address: string, amount: number, contractAddress?: string) => Promise<string>;
  /** Removes the instance; call it in the scenario's `teardown`. */
  down: () => Promise<void>;
};

/**
 * Starts an instance and resolves once it is up. The same params give the same instance:
 * if it is already running, its state is not reset.
 * The instance is removed by `down`, and on exit signals if the scenario never got there.
 */
export async function startSandbox(
  { family, network }: SandboxTarget,
  params: Record<string, unknown>,
  options: SandboxUpOptions = {},
): Promise<Sandbox> {
  const startup = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const { status, headers, body } = await request(
    `/${family}/${network}/up`,
    "POST",
    params,
    startup,
  );
  if (!isInstance(body)) {
    throw new Error(`coin-sandbox up: unexpected answer ${JSON.stringify(body)}`);
  }
  hookSignals();
  started.set(body.instance, body);

  const down = () => removeInstance(body);

  try {
    const running =
      status === 200 ? body : await waitUntilUp(...monitorOf(headers, options), startup);
    return {
      endpoints: running.endpoints ?? {},
      airdrop: async (address, amount, contractAddress) => {
        const { body: answer } = await request(`/${family}/airdrop`, "POST", {
          instance: body.instance,
          address,
          amount,
          contractAddress,
        });
        if (!isRecord(answer) || typeof answer.txHash !== "string") {
          throw new Error(`coin-sandbox airdrop: unexpected answer ${JSON.stringify(answer)}`);
        }
        return answer.txHash;
      },
      down,
    };
  } catch (error) {
    await down().catch(() => undefined);
    throw error;
  }
}

// Stays tracked until the sandbox confirmed the removal, so a later exit signal can retry
async function removeInstance({ family, network, instance }: SandboxInstance): Promise<void> {
  await request(
    `/${family}/${network}/down`,
    "POST",
    { instance },
    AbortSignal.timeout(DOWN_TIMEOUT_MS),
  );
  started.delete(instance);
}

async function downAll(): Promise<void> {
  const results = await Promise.allSettled([...started.values()].map(removeInstance));
  for (const result of results) {
    if (result.status === "rejected") console.warn(String(result.reason));
  }
}
