import { DeviceModelId } from "@ledgerhq/device-management-kit";

export const DEFAULT_SPECULOS_URL = "http://127.0.0.1:5000";
export const DEFAULT_SPECULOS_MODEL = DeviceModelId.STAX;

export const SPECULOS_MODELS: DeviceModelId[] = [
  DeviceModelId.NANO_S,
  DeviceModelId.NANO_SP,
  DeviceModelId.NANO_X,
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
];

export type TransportKind = "webhid" | "webble" | "mockserver" | "speculos";

export type DeviceTarget =
  | { kind: "webhid" }
  | { kind: "webble" }
  | { kind: "mockserver"; token?: string }
  | { kind: "speculos"; model: DeviceModelId; url: string };

// The deviceId is the only thing `withDevice` hands to the transport modules, so the transport
// settings are encoded in it: `speculos|<model>|<url>`, and `mockserver` or `mockserver|<token>`
// to join an existing mock server session instead of creating one.
const SPECULOS_PREFIX = "speculos|";
const MOCK_SERVER_PREFIX = "mockserver|";

export function buildMockServerDeviceId(token?: string): string {
  const trimmed = token?.trim();
  return trimmed ? `${MOCK_SERVER_PREFIX}${trimmed}` : "mockserver";
}

export function buildSpeculosDeviceId(url: string, model: DeviceModelId): string {
  return `${SPECULOS_PREFIX}${model}|${url.trim().replace(/\/+$/, "")}`;
}

export function parseDeviceId(deviceId: string): DeviceTarget | null {
  if (deviceId === "webhid") return { kind: "webhid" };
  if (deviceId === "webble") return { kind: "webble" };
  if (deviceId === "mockserver") return { kind: "mockserver" };
  if (deviceId.startsWith(MOCK_SERVER_PREFIX)) {
    const token = deviceId.slice(MOCK_SERVER_PREFIX.length);
    return token ? { kind: "mockserver", token } : null;
  }
  if (!deviceId.startsWith(SPECULOS_PREFIX)) return null;
  const rest = deviceId.slice(SPECULOS_PREFIX.length);
  const separator = rest.indexOf("|");
  if (separator === -1) return null;
  const model = SPECULOS_MODELS.find(m => m === rest.slice(0, separator));
  const url = rest.slice(separator + 1);
  return model && url ? { kind: "speculos", model, url } : null;
}
