import axios from "axios";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  conventionalAppSubpath,
  DeviceParams,
  reverseModelMap,
} from "@ledgerhq/speculos-transport";
import { SpeculosDevice } from "./speculos";
import { sanitizeError } from "./index";
import { getSpeculosScreenMode, registerSpeculosScreen } from "./speculosScreen";
import { v4 as uuid } from "uuid";

/** Speculinho operator base URL (no trailing slash). In CI, set via the `SPECULINHO_URL` secret / env var. */
function getSpeculinhoBaseUrl(): string | undefined {
  const raw = process.env.SPECULINHO_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : undefined;
}

const speculosPort = 443;

/**
 * Session token of each session acquired by this process; undefined when Speculinho did not
 * grant a protected session.
 */
const sessionTokens = new Map<string, string | undefined>();

// Lets another process (e.g. the mobile teardown releasing a dead worker's sessions) authenticate.
const SESSION_TOKEN_DIR = path.join(os.tmpdir(), "ledger-live-speculinho-sessions");
const RUN_ID_PATTERN = /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?$/;

function sessionTokenPath(runId: string): string | undefined {
  return RUN_ID_PATTERN.test(runId) ? path.join(SESSION_TOKEN_DIR, runId) : undefined;
}

/**
 * Whether the token directory is a real directory owned by this user, which is then made private
 * (0700). Under a fixed name in the shared temp dir it may have been created by someone else, who
 * could read or plant files in it; `mkdir`'s `mode` only applies when it creates the directory.
 */
async function claimSessionTokenDir(): Promise<boolean> {
  try {
    const stats = await fs.lstat(SESSION_TOKEN_DIR);
    const uid = process.getuid?.();
    if (!stats.isDirectory() || (uid !== undefined && stats.uid !== uid)) return false;
    await fs.chmod(SESSION_TOKEN_DIR, 0o700);
    return true;
  } catch {
    return false;
  }
}

async function persistSessionToken(runId: string, token: string): Promise<void> {
  const file = sessionTokenPath(runId);
  if (!file) {
    console.warn(
      `[speculosCI] Not persisting the session token of invalid run_id ${JSON.stringify(runId)}`,
    );
    return;
  }
  try {
    await fs.mkdir(SESSION_TOKEN_DIR, { recursive: true, mode: 0o700 });
    if (!(await claimSessionTokenDir())) {
      console.warn(
        `[speculosCI] Not persisting the session token of ${runId}: ${SESSION_TOKEN_DIR} is not a directory of this user`,
      );
      return;
    }
    await fs.writeFile(file, token, { mode: 0o600 });
  } catch (error) {
    console.warn(
      `[speculosCI] Could not persist the session token of ${runId}:`,
      sanitizeError(error),
    );
  }
}

async function getSessionToken(runId: string): Promise<string | undefined> {
  if (sessionTokens.has(runId)) return sessionTokens.get(runId);
  const file = sessionTokenPath(runId);
  if (!file || !(await claimSessionTokenDir())) return undefined;
  return await fs.readFile(file, "utf-8").catch(() => undefined);
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function sessionHeaders(runId: string): Promise<Record<string, string>> {
  return authHeaders(await getSessionToken(runId));
}

async function forgetSession(runId: string): Promise<void> {
  const token = sessionTokens.get(runId);
  sessionTokens.delete(runId);
  if (token && process.env.SPECULOS_SESSION_TOKEN === token) {
    delete process.env.SPECULOS_SESSION_TOKEN;
  }
  const file = sessionTokenPath(runId);
  if (file) await fs.rm(file, { force: true });
}

let warnedUnprotected = false;

function warnUnprotectedSession(reason: string): void {
  if (warnedUnprotected) return;
  warnedUnprotected = true;
  console.warn(`[speculosCI] Speculinho sessions are not protected: ${reason}`);
}

function uniqueId(): string {
  return uuid();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * DNS-1123 run_id for Speculinho (max 63 chars): lowercase, hyphens, alphanumeric.
 */
function makeRunId(deviceParams: DeviceParams): string {
  const slug = slugify(deviceParams.appName) || "app";
  const id = uniqueId().replaceAll("-", "").slice(0, 12);
  const environment = process.env.CI ? "ci" : "local";
  const combined = `${slug.slice(0, 20)}-lw-${environment}-${id}`;
  return combined.slice(0, 63);
}

type SpeculinhoAcquireResponse = {
  run_id?: string;
  status?: string;
  speculos_url?: string;
  protected?: boolean;
  session_token?: string;
  vnc_url?: string;
  vnc_password?: string;
};

type SpeculinhoStatusResponse = {
  run_id?: string;
  status?: "pending" | "ready" | "failed";
  speculos_url?: string;
  error_details?: string;
  protected?: boolean;
};

/** A session state that polling again will not fix. */
class SpeculinhoSessionError extends Error {
  override name = "SpeculinhoSessionError";
}

function buildAcquirePayload(
  deviceParams: DeviceParams,
  runId: string,
  seed: string,
  protectedSession: boolean,
  vnc: boolean,
) {
  const { model, firmware, appName, appVersion, dependencies, pki } = deviceParams;
  const device = reverseModelMap[model];
  if (!device) {
    throw new Error(`[speculosCI] Unsupported device model for Speculinho: ${String(model)}`);
  }

  const rawTag = process.env.SPECULOS_IMAGE_TAG?.trim();
  const tag =
    rawTag && rawTag.includes(":") ? rawTag.slice(rawTag.lastIndexOf(":") + 1) : rawTag || "latest";

  const libraries =
    dependencies?.map(dep => ({
      name: dep.name,
      path: `/apps/${conventionalAppSubpath(
        model,
        firmware,
        dep.name,
        dep.appVersion ?? appVersion,
      )}`,
    })) ?? undefined;

  return {
    coin_app: appName,
    coin_app_version: appVersion,
    device,
    device_os_version: firmware,
    seed,
    run_id: runId,
    speculos_version: tag,
    ...(libraries?.length ? { libraries } : {}),
    /** Speculos PKI flag, same as the local Docker provider. */
    extra_args: pki ? ["-p"] : [],
    ...(protectedSession ? { protected: true } : {}),
    ...(vnc ? { vnc: true } : {}),
  };
}

export async function waitForSpeculosReady(
  deviceId: string,
  { interval = 2_000, timeout = 150_000 } = {},
): Promise<void> {
  const speculinhoUrl = getSpeculinhoBaseUrl();
  if (!speculinhoUrl) {
    throw new Error(
      "SPECULINHO_URL is not set — required for remote Speculos (Speculinho operator).",
    );
  }

  const statusUrl = `${speculinhoUrl}/status/${encodeURIComponent(deviceId)}`;
  const token = await getSessionToken(deviceId);
  const headers = authHeaders(token);
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const res = await axios.get<SpeculinhoStatusResponse>(statusUrl, {
        headers,
        timeout: 10_000,
        validateStatus: s => s >= 200 && s < 500,
      });

      if (res.status === 401) {
        throw new SpeculinhoSessionError(
          `[speculosCI] Speculinho rejected the session token for ${deviceId}`,
        );
      }

      if (res.status === 200 && res.data) {
        const { status, speculos_url, error_details } = res.data;

        if (token && res.data.protected !== true) {
          throw new SpeculinhoSessionError(
            `[speculosCI] Speculinho no longer reports ${deviceId} as a protected session`,
          );
        }

        if (status === "ready" && speculos_url) {
          process.env.SPECULOS_ADDRESS = speculos_url.replace(/\/+$/, "");
          // Read by the Speculos HTTP clients (e2e helpers, DMK transports, CLI, desktop app).
          if (token) {
            process.env.SPECULOS_SESSION_TOKEN = token;
          } else {
            delete process.env.SPECULOS_SESSION_TOKEN;
          }
          registerSpeculosScreen(deviceId, { web: { url: process.env.SPECULOS_ADDRESS, token } });
          console.warn(`Speculos is ready at ${process.env.SPECULOS_ADDRESS}`);
          return;
        }

        if (status === "failed") {
          throw new SpeculinhoSessionError(
            `[speculosCI] Speculinho instance failed for ${deviceId}: ${error_details ?? JSON.stringify(res.data)}`,
          );
        }
      }
    } catch (e: unknown) {
      if (e instanceof SpeculinhoSessionError) {
        throw e;
      }
      console.warn(`Speculos status poll error (${deviceId}): ${sanitizeError(e)}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout: ${statusUrl} did not become ready within ${timeout}ms`);
}

function formatAcquireFailure(status: number, data: unknown): string {
  const body = typeof data === "string" ? data : JSON.stringify(data);
  return `Speculinho POST /acquire failed with HTTP ${status}${body ? `: ${body}` : ""}`;
}

/**
 * Error thrown when Speculinho `/acquire` fails.
 * Carries the `run_id` so we can still fetch `/status` and `/logs`.
 */
export class SpeculinhoAcquireError extends Error {
  readonly runId: string;
  constructor(message: string, runId: string) {
    super(message);
    this.name = "SpeculinhoAcquireError";
    this.runId = runId;
  }
}

/** `/acquire` got no response, so an instance may exist under `runId` and must be released. */
export class SpeculinhoAcquireUnconfirmedError extends SpeculinhoAcquireError {
  override name = "SpeculinhoAcquireUnconfirmedError";
}

export function getSpeculinhoRunIdFromError(error: unknown): string | undefined {
  if (error instanceof SpeculinhoAcquireError) return error.runId;
  if (error && typeof error === "object" && "runId" in error) {
    const { runId } = error as { runId?: unknown };
    if (typeof runId === "string" && runId) return runId;
  }
  return undefined;
}

async function rememberSession(runId: string, data?: SpeculinhoAcquireResponse): Promise<void> {
  const token = data?.protected === true ? data.session_token : undefined;
  if (!token) {
    warnUnprotectedSession("the operator did not grant a protected session (operator < 2.0.0?)");
  }
  sessionTokens.set(runId, token);
  if (token) await persistSessionToken(runId, token);
  if (data?.vnc_url && data.vnc_password) {
    registerSpeculosScreen(runId, {
      vnc: { kind: "websocket", url: data.vnc_url, password: data.vnc_password, token },
    });
  }
}

export async function createSpeculosDeviceCI(
  deviceParams: DeviceParams,
): Promise<SpeculosDevice | undefined> {
  const speculinhoUrl = getSpeculinhoBaseUrl();
  if (!speculinhoUrl) {
    throw new Error(
      "[speculosCI] SPECULINHO_URL is not set. Set the env var (e.g. GitHub Actions secret SPECULINHO_URL on the iOS E2E job) to your Speculinho operator base URL.",
    );
  }

  const seed = process.env.SEED?.trim();
  if (!seed) {
    throw new Error("[speculosCI] SEED is not set — required for Speculinho /acquire.");
  }

  let runId = makeRunId(deviceParams);
  let protectedSession = true;
  let vnc = getSpeculosScreenMode() === "vnc";

  for (let attempt = 0; attempt < 5; attempt++) {
    const payload = buildAcquirePayload(deviceParams, runId, seed, protectedSession, vnc);
    let res;
    try {
      res = await axios.post<SpeculinhoAcquireResponse>(`${speculinhoUrl}/acquire`, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 30_000,
        validateStatus: () => true,
      });
    } catch (error: unknown) {
      throw new SpeculinhoAcquireUnconfirmedError(
        `[speculosCI] Speculinho /acquire transport error (${speculinhoUrl}): ${sanitizeError(error)}`,
        runId,
      );
    }

    if (res.status === 202) {
      const finalRunId = res.data?.run_id ?? runId;
      await rememberSession(finalRunId, res.data);
      return {
        id: finalRunId,
        port: speculosPort,
        appName: deviceParams.appName,
        appVersion: deviceParams.appVersion,
        dependencies: deviceParams.dependencies,
      };
    }

    if (res.status === 409) {
      runId = makeRunId(deviceParams);
      continue;
    }

    // An operator running without the session gate answers `vnc` and `protected` with 400.
    if (res.status === 400 && vnc) {
      console.warn(
        `[speculosCI] Speculinho VNC unavailable: ${formatAcquireFailure(res.status, res.data)}`,
      );
      vnc = false;
      continue;
    }
    if (res.status === 400 && protectedSession) {
      warnUnprotectedSession(formatAcquireFailure(res.status, res.data));
      protectedSession = false;
      continue;
    }

    throw new SpeculinhoAcquireError(formatAcquireFailure(res.status, res.data), runId);
  }

  throw new SpeculinhoAcquireError(
    `[speculosCI] Speculinho /acquire failed after retries (run_id collisions). Last run_id: ${runId}`,
    runId,
  );
}

/** Resolves to whether Speculinho confirmed the release or reported no such instance. */
export async function releaseSpeculosDeviceCI(runId: string): Promise<boolean> {
  const speculinhoUrl = getSpeculinhoBaseUrl();
  if (!speculinhoUrl) {
    console.warn("[speculosCI] SPECULINHO_URL is not set; skipping Speculinho release.");
    return false;
  }

  try {
    await axios.post(
      `${speculinhoUrl}/release`,
      { run_id: runId.toString() },
      {
        headers: { "Content-Type": "application/json", ...(await sessionHeaders(runId)) },
        timeout: 30_000,
        validateStatus: s => (s >= 200 && s < 300) || s === 404,
      },
    );
    await forgetSession(runId);
    return true;
  } catch (error) {
    console.warn(`Failed to release remote Speculos ${runId}:`, sanitizeError(error));
    return false;
  }
}

/**
 * Fetches Speculos pod stderr from Speculinho (GET /logs/{run_id}).
 * Call while the instance is still up (before POST /release).
 */
export async function fetchSpeculinhoLogs(runId: string): Promise<string> {
  const speculinhoUrl = getSpeculinhoBaseUrl();
  if (!speculinhoUrl) {
    return "[speculosCI] SPECULINHO_URL is not set; cannot fetch Speculinho logs.";
  }

  const url = `${speculinhoUrl}/logs/${encodeURIComponent(runId)}`;
  try {
    const res = await axios.get<string>(url, {
      headers: await sessionHeaders(runId),
      responseType: "text",
      timeout: 10_000,
      validateStatus: () => true,
    });

    if (res.status === 200 && typeof res.data === "string") {
      return res.data;
    }

    const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "");
    return `[speculosCI] Speculinho GET /logs/${runId} returned HTTP ${res.status}${body ? `\n${body}` : ""}`;
  } catch (error: unknown) {
    return `[speculosCI] Speculinho GET /logs failed: ${sanitizeError(error).message}`;
  }
}

/**
 * Fetches Speculinho pod status (GET /status/{run_id}).
 * Useful as extra debug on failure — surfaces pod state (Running / CrashLoopBackOff / …) and any kube-side error.
 */
export async function fetchSpeculinhoStatus(runId: string): Promise<string> {
  const speculinhoUrl = getSpeculinhoBaseUrl();
  if (!speculinhoUrl) {
    return "[speculosCI] SPECULINHO_URL is not set; cannot fetch Speculinho status.";
  }

  const url = `${speculinhoUrl}/status/${encodeURIComponent(runId)}`;
  try {
    const res = await axios.get(url, {
      headers: await sessionHeaders(runId),
      timeout: 10_000,
      validateStatus: () => true,
    });

    const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "", null, 2);
    if (res.status === 200) {
      return body;
    }
    return `[speculosCI] Speculinho GET /status/${runId} returned HTTP ${res.status}${body ? `\n${body}` : ""}`;
  } catch (error: unknown) {
    return `[speculosCI] Speculinho GET /status failed: ${sanitizeError(error).message}`;
  }
}
