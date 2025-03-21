import Transport from "@ledgerhq/hw-transport";
import { FirmwareInfoEntity } from "../entities/FirmwareInfoEntity";
import { APDU } from "../entities/APDU";
import { parseGetVersionResponse } from "./parseGetVersionResponse";

export const GET_VERSION_APDU: APDU = [0xe0, 0x01, 0x00, 0x00, undefined];

/**
 * Get the FirmwareInfo of a given device.
 *
 * @param transport - The transport to communicate with the device.
 * @param options - Optional options:
 *   - abortTimeoutMs: aborts the APDU exchange after a given timeout.
 */
export async function getVersion(
  transport: Transport,
  { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
): Promise<FirmwareInfoEntity> {
  async function getVersionWrapper(attempt: number): Promise<FirmwareInfoEntity> {
    const res = await transport.send(...GET_VERSION_APDU, undefined, { abortTimeoutMs });
    if (res.length === 15 && res.slice(2, 7).toString() === "BOLOS" && attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return getVersionWrapper(attempt + 1);
    }
    return parseGetVersionResponse(res);
  }

  return getVersionWrapper(0);
}
