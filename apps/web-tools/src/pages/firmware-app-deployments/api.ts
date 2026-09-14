import { getEnv } from "@shared/env";
import type { CatalogEntry, DeviceVersion, FinalFirmwareVersion } from "./types";

/*
 * The Manager API is read straight from the browser with `fetch`, rather than through
 * live-common's HttpManagerApiRepository, for two reasons:
 *
 *   - `catalogForDevice` is wrapped in a 5-minute LRU cache. This page has an explicit
 *     Refresh button, and a refresh that silently replays a cached response is not one.
 *   - the repository is built for a plugged-in device, so it only exposes single-item
 *     lookups. Enumerating every device and every published OS — which is the whole job
 *     here — has no equivalent on it.
 *
 * The base URL still comes from the environment, so the staging switch works as it does
 * everywhere else. Ledger Live also sends a `livecommonversion` query parameter; it is
 * omitted deliberately, because every endpoint returns byte-identical responses with it,
 * without it, and with a nonsense value.
 */
const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${getEnv("MANAGER_API_BASE")}${path}`);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} on ${path}`);
  }
  return response.json() as Promise<T>;
};

export const fetchDeviceVersions = (): Promise<DeviceVersion[]> =>
  fetchJson<DeviceVersion[]>("/device_versions");

export const fetchFinalFirmwareVersions = (): Promise<FinalFirmwareVersion[]> =>
  fetchJson<FinalFirmwareVersion[]>("/firmware_final_versions");

export const fetchCatalog = (params: {
  provider: number;
  targetId: number;
  firmwareVersionName: string;
}): Promise<CatalogEntry[]> =>
  fetchJson<CatalogEntry[]>(
    "/v2/apps/by-target" +
      `?provider=${params.provider}` +
      `&target_id=${params.targetId}` +
      `&firmware_version_name=${encodeURIComponent(params.firmwareVersionName)}`,
  );
