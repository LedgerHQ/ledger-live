import { DeviceModelId } from "@ledgerhq/device-management-kit";

const DEFAULT_SPECULOS_ADDRESS = "http://127.0.0.1";
const DEFAULT_SPECULOS_API_PORT = "5000";

// Speculos cannot tell the DMK transport which device it emulates, so the model comes from the
// SPECULOS_DEVICE names used by the Ledger Live e2e setup.
const SPECULOS_DEVICE_MODELS: Record<string, DeviceModelId> = {
  nanoS: DeviceModelId.NANO_S,
  nanoSP: DeviceModelId.NANO_SP,
  nanoX: DeviceModelId.NANO_X,
  stax: DeviceModelId.STAX,
  flex: DeviceModelId.FLEX,
  nanoGen5: DeviceModelId.APEX,
};

export type SpeculosConfig = {
  /** Base URL of the Speculos REST API, e.g. `http://127.0.0.1:5000`. */
  url: string;
  deviceModelId: DeviceModelId;
};

export class InvalidSpeculosConfigError extends Error {
  override name = "InvalidSpeculosConfigError";
}

/**
 * Speculos target from `SPECULOS_API_PORT`, `SPECULOS_ADDRESS` and `SPECULOS_DEVICE`, or `null`
 * when neither of the first two is set, in which case wallet-cli talks to a USB device.
 */
export function readSpeculosConfig(env: NodeJS.ProcessEnv = process.env): SpeculosConfig | null {
  const port = env.SPECULOS_API_PORT?.trim();
  const address = env.SPECULOS_ADDRESS?.trim();
  if (!port && !address) return null;

  return {
    url: speculosUrl(address || DEFAULT_SPECULOS_ADDRESS, port),
    deviceModelId: speculosDeviceModel(env.SPECULOS_DEVICE?.trim()),
  };
}

function speculosUrl(address: string, port: string | undefined): string {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    throw new InvalidSpeculosConfigError(`SPECULOS_ADDRESS is not a valid URL: "${address}".`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidSpeculosConfigError(
      `SPECULOS_ADDRESS must use http or https, got "${url.protocol}".`,
    );
  }
  // An address that already carries a port wins, as in the legacy CLI. `url.port` is empty for a
  // scheme's default port, so the raw host is checked instead.
  if (!hasExplicitPort(address)) url.port = speculosPort(port || DEFAULT_SPECULOS_API_PORT);
  return url.origin;
}

function hasExplicitPort(address: string): boolean {
  return /^[a-z][a-z\d+.-]*:\/\/[^/?#]*:\d+(?:[/?#]|$)/i.test(address);
}

function speculosPort(raw: string): string {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new InvalidSpeculosConfigError(
      `SPECULOS_API_PORT must be a port number between 1 and 65535, got "${raw}".`,
    );
  }
  return String(port);
}

function speculosDeviceModel(name: string | undefined): DeviceModelId {
  // Same default as the Speculos DMK transport and the legacy CLI.
  if (!name) return DeviceModelId.STAX;
  const model = SPECULOS_DEVICE_MODELS[name];
  if (!model) {
    throw new InvalidSpeculosConfigError(
      `SPECULOS_DEVICE must be one of ${Object.keys(SPECULOS_DEVICE_MODELS).join(", ")}, got "${name}".`,
    );
  }
  return model;
}
