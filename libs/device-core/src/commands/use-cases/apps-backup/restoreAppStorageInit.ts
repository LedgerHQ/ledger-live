import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import { APDU } from "src/commands/entities/APDU";

/**
 * Name in documentation: INS_APP_STORAGE_RESTORE_INIT
 * cla: 0xe0
 * ins: 0x6c
 * p1: 0x00
 * p2: 0x00
 * data: will filled at runtime
 */
const RESTORE_APP_STORAGE_INIT: APDU = [0xe0, 0x6c, 0x00, 0x00, Buffer.from([])];

/**
 * 0x9000: Success.
 * 0x5123: Application not found.
 * 0x662F: Invalid device state, recovery mode.
 * 0x5501: Invalid consent, user rejected.
 * 0x5502: Invalid consent, pin is not set.
 * 0x670A: Invalid application name length, two chars minimum.
 * 0x6733: Invalid BACKUP_LEN value.
 */
const RESPONSE_STATUS_SET: number[] = [
  StatusCodes.OK,
  StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
  StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
  StatusCodes.USER_REFUSED_ON_DEVICE,
  StatusCodes.PIN_NOT_SET,
  StatusCodes.INVALID_APP_NAME_LEN,
  StatusCodes.INVALID_BACKUP_LEN,
];

/**
 * Restores the application storage initialization.
 *
 * @param transport - The transport object used for communication with the device.
 * @returns A promise that resolves to a string representing the parsed response.
 */
export async function restoreAppStorageInit(transport: Transport): Promise<string> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "restoreAppStorageInit",
  });
  tracer.trace("Start");

  const response = await transport.send(...RESTORE_APP_STORAGE_INIT, RESPONSE_STATUS_SET);
  return parseResponse(response);
}

function parseResponse(data: Buffer): string {
  return data.toString("utf-8");
}
