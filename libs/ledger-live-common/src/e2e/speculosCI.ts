import axios from "axios";
import {
  conventionalAppSubpath,
  DeviceParams,
  reverseModelMap,
} from "@ledgerhq/speculos-transport";
import { SpeculosDevice } from "./speculos";
import { sanitizeError } from "./index";
import { v4 as uuid } from "uuid";

const { SEED, SPECULOS_IMAGE_TAG } = process.env;

/** Speculinho operator base URL (no trailing slash). In CI, set via the `SPECULINHO_URL` secret / env var. */
function getSpeculinhoBaseUrl(): string | undefined {
  const raw = process.env.SPECULINHO_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : undefined;
}

const speculosPort = 443;

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
  const suffix = uniqueId().replace(/-/g, "").slice(0, 12);
  const combined = `${slug.slice(0, 20)}-${suffix}`;
  return combined.slice(0, 63);
}

type SpeculinhoAcquireResponse = {
  run_id?: string;
  status?: string;
};

type SpeculinhoStatusResponse = {
  run_id?: string;
  status?: "pending" | "ready" | "failed";
  speculos_url?: string;
  error_details?: string;
};

function buildAcquirePayload(deviceParams: DeviceParams, runId: string, seed: string) {
  const { model, firmware, appName, appVersion, dependencies } = deviceParams;
  const device = reverseModelMap[model];
  if (!device) {
    throw new Error(`[speculosCI] Unsupported device model for Speculinho: ${String(model)}`);
  }

  const rawTag = SPECULOS_IMAGE_TAG?.trim();
  const tag =
    rawTag && rawTag.includes(":")
      ? rawTag.slice(rawTag.lastIndexOf(":") + 1)
      : rawTag || "latest";

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
    coin_app: appName.replace(/ /g, ""),
    coin_app_version: appVersion,
    device,
    device_os_version: firmware,
    seed,
    run_id: runId,
    speculos_version: tag,
    ...(libraries?.length ? { libraries } : {}),
    /** Matches legacy workflow `additional_args` / local Docker Detox (`-p`). */
    extra_args: ["-p"],
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
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const res = await axios.get<SpeculinhoStatusResponse>(statusUrl, {
        timeout: 10_000,
        validateStatus: s => s >= 200 && s < 500,
      });

      if (res.status === 200 && res.data) {
        const { status, speculos_url, error_details } = res.data;

        if (status === "ready" && speculos_url) {
          process.env.SPECULOS_ADDRESS = speculos_url.replace(/\/+$/, "");
          console.warn(`Speculos is ready at ${process.env.SPECULOS_ADDRESS}`);
          return;
        }

        if (status === "failed") {
          throw new Error(
            `[speculosCI] Speculinho instance failed for ${deviceId}: ${error_details ?? JSON.stringify(res.data)}`,
          );
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Speculinho instance failed")) {
        throw e;
      }
      console.warn(`Speculos status poll error (${deviceId}): ${sanitizeError(e)}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout: ${statusUrl} did not become ready within ${timeout}ms`);
}

export async function createSpeculosDeviceCI(
  deviceParams: DeviceParams,
): Promise<SpeculosDevice | undefined> {
  const speculinhoUrl = getSpeculinhoBaseUrl();
  if (!speculinhoUrl) {
    console.warn("[speculosCI] SPECULINHO_URL is not set — cannot acquire remote Speculos.");
    return undefined;
  }

  if (!SEED) {
    console.warn("[speculosCI] SEED is not set — cannot acquire remote Speculos.");
    return undefined;
  }

  let runId = makeRunId(deviceParams);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const payload = buildAcquirePayload(deviceParams, runId, SEED);
      const res = await axios.post<SpeculinhoAcquireResponse>(
        `${speculinhoUrl}/acquire`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          validateStatus: () => true,
        },
      );

      if (res.status === 202) {
        const finalRunId = res.data?.run_id ?? runId;
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

      console.warn(
        `[speculosCI] Speculinho acquire failed (${res.status}): ${JSON.stringify(res.data)}`,
      );
      console.warn(
        `Failed to create remote Speculos ${deviceParams.appName}:${deviceParams.appVersion}`,
      );
      return {
        id: runId,
        port: 0,
        appName: deviceParams.appName,
        appVersion: deviceParams.appVersion,
        dependencies: deviceParams.dependencies,
      };
    } catch (error: unknown) {
      console.warn(
        `Failed to create remote Speculos ${deviceParams.appName}:${deviceParams.appVersion}:`,
        sanitizeError(error),
      );
      return {
        id: runId,
        port: 0,
        appName: deviceParams.appName,
        appVersion: deviceParams.appVersion,
        dependencies: deviceParams.dependencies,
      };
    }
  }

  console.warn(`Failed to create remote Speculos after retries for run_id collisions`);
  return {
    id: runId,
    port: 0,
    appName: deviceParams.appName,
    appVersion: deviceParams.appVersion,
    dependencies: deviceParams.dependencies,
  };
}

export async function releaseSpeculosDeviceCI(runId: string) {
  const speculinhoUrl = getSpeculinhoBaseUrl();
  if (!speculinhoUrl) {
    console.warn("[speculosCI] SPECULINHO_URL is not set; skipping Speculinho release.");
    return;
  }

  try {
    await axios.post(
      `${speculinhoUrl}/release`,
      { run_id: runId.toString() },
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: s => s >= 200 && s < 300,
      },
    );
  } catch (error) {
    console.warn(`Failed to release remote Speculos ${runId}:`, sanitizeError(error));
  }
}
