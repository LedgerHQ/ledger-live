import type { DeviceModelId, TransportFactory } from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";
import { ledgerToDmkDeviceIdMap } from "../config/dmkToLedgerDeviceIdMap";
import type { SpeculosSessionTarget } from "./SpeculosTransportSession";

export type SpeculosTarget = Readonly<{
  url: string;
  deviceModelId: DeviceModelId;
  /** Token of a protected Speculinho session. */
  bearerToken?: string;
}>;

// Speculos cannot tell the DMK transport which device it emulates, so the model comes from the
// SPECULOS_DEVICE name set by the e2e setup.
const SPECULOS_DEVICE_TO_MODEL = new Map<string, LLDeviceModelId>([
  ["nanoS", LLDeviceModelId.nanoS],
  ["nanoSP", LLDeviceModelId.nanoSP],
  ["nanoX", LLDeviceModelId.nanoX],
  ["stax", LLDeviceModelId.stax],
  ["flex", LLDeviceModelId.europa],
  ["europa", LLDeviceModelId.europa],
  ["nanoGen5", LLDeviceModelId.apex],
]);

const DEFAULT_SPECULOS_MODEL = LLDeviceModelId.nanoSP;

function withoutTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
}

function endsWithPort(host: string): boolean {
  let index = host.length - 1;
  if (index < 0 || host[index] < "0" || host[index] > "9") return false;
  while (index >= 0 && host[index] >= "0" && host[index] <= "9") index--;
  return index >= 0 && host[index] === ":";
}

/**
 * Speculos target from `SPECULOS_API_PORT`, `SPECULOS_ADDRESS`, `SPECULOS_DEVICE` and
 * `SPECULOS_SESSION_TOKEN`, or `null` when `SPECULOS_API_PORT` is unset. A port already in
 * `SPECULOS_ADDRESS` wins.
 */
export function readSpeculosTarget(env: NodeJS.ProcessEnv = process.env): SpeculosTarget | null {
  const port = env.SPECULOS_API_PORT;
  if (!port) return null;

  const configuredHost = withoutTrailingSlashes(env.SPECULOS_ADDRESS || "http://127.0.0.1");
  const url = endsWithPort(configuredHost) ? configuredHost : `${configuredHost}:${port}`;
  const model = SPECULOS_DEVICE_TO_MODEL.get(env.SPECULOS_DEVICE ?? "") ?? DEFAULT_SPECULOS_MODEL;

  return {
    url,
    deviceModelId: ledgerToDmkDeviceIdMap[model],
    bearerToken: env.SPECULOS_SESSION_TOKEN,
  };
}

/** DMK transport factory for a Speculos target, in e2e mode (no disconnect polling). */
export function speculosTargetTransportFactory(target: SpeculosSessionTarget): TransportFactory {
  return speculosTransportFactory(target.url, true, target.deviceModelId, {
    bearerToken: target.bearerToken,
  });
}
