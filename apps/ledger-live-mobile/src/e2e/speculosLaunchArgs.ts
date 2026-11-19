import { DeviceModelId } from "@ledgerhq/types-devices";

export type KnownSpeculos = {
  address: string;
  model: DeviceModelId;
  sessionToken?: string;
};

const DEVICE_MODELS = new Set<string>(Object.values(DeviceModelId));
const HTTP_URL = /^https?:\/\/\S+$/;

/**
 * The Speculos device named by the launch arguments `speculosUrl` and `speculosModel`, with the
 * optional `speculosToken` of a protected Speculinho session, or null when they name none.
 */
export function readSpeculosLaunchArgs(args: Record<string, unknown>): KnownSpeculos | null {
  const url = args["speculosUrl"];
  const model = args["speculosModel"];
  const sessionToken = args["speculosToken"];
  if (typeof url !== "string" || !HTTP_URL.test(url)) return null;
  if (typeof model !== "string" || !DEVICE_MODELS.has(model)) return null;
  return {
    address: url.replace(/\/+$/, ""),
    model: model as DeviceModelId,
    ...(typeof sessionToken === "string" && sessionToken !== "" ? { sessionToken } : {}),
  };
}
