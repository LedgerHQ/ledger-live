import Transport from "@ledgerhq/hw-transport";
import { parseGetVersionResponse } from "./use-cases/parseGetVersionResponse";
import { APDU, FirmwareInfoEntity, GetVersionOptions } from "../types";

export const GET_VERSION_APDU: APDU = [0xe0, 0x01, 0x00, 0x00, undefined];

/**
 * Get the FirmwareInfo of a given device
 *
 * @param transport
 * @param options - Contains optional options:
 *  - abortTimeoutMs: aborts the APDU exchange after a given timeout
 */
export async function getVersion(
  transport: Transport,
  { abortTimeoutMs }: GetVersionOptions = {},
): Promise<FirmwareInfoEntity> {
  const res = await transport.send(...GET_VERSION_APDU, undefined, {
    abortTimeoutMs,
  });
  return parseGetVersionResponse(res);
}
