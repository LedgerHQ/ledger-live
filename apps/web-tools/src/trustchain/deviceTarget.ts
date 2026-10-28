export type TransportKind = "webhid" | "webble" | "mockserver";

export type DeviceTarget =
  | { kind: "webhid" }
  | { kind: "webble" }
  | { kind: "mockserver"; token?: string };

// The deviceId is the only thing `withDevice` hands to the transport modules, so the transport
// settings are encoded in it: `webhid`, `webble`, and `mockserver` or `mockserver|<token>` to join
// an existing mock server session instead of creating one.
const MOCK_SERVER_PREFIX = "mockserver|";

export function buildMockServerDeviceId(token?: string): string {
  const trimmed = token?.trim();
  return trimmed ? `${MOCK_SERVER_PREFIX}${trimmed}` : "mockserver";
}

export function parseDeviceId(deviceId: string): DeviceTarget | null {
  if (deviceId === "webhid") return { kind: "webhid" };
  if (deviceId === "webble") return { kind: "webble" };
  if (deviceId === "mockserver") return { kind: "mockserver" };
  if (deviceId.startsWith(MOCK_SERVER_PREFIX)) {
    const token = deviceId.slice(MOCK_SERVER_PREFIX.length);
    return token ? { kind: "mockserver", token } : null;
  }
  return null;
}
