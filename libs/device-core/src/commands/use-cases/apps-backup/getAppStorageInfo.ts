import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import { APDU } from "src/commands/entities/APDU";

/**
 * Name in documentation: INS_APP_STORAGE_GET_INFO
 * cla: 0xe0
 * ins: 0x6a
 * p1: 0x00
 * p2: 0x00
 * data: APP_NAME_LEN (1 byte) + APP_NAME (variable)
 */
const GET_APP_STORAGE_INFO: APDU = [0xe0, 0x6a, 0x00, 0x00, Buffer.from([])];

/**
 * 0x9000: Success.
 * 0x5123: Application not found.
 * 0x662F: If the device is in recovery mode.
 * 0x670A: Invalid application name length, two chars minimum.
 */
const RESPONSE_STATUS_SET: number[] = [
  StatusCodes.OK,
  StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
  StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
  StatusCodes.INVALID_APP_NAME_LEN,
];

/**
 * Retrieves the storage information of the app from the device.
 *
 * @param transport - The transport object used to communicate with the device.
 * @returns A promise that resolves to a string representing the app storage information.
 */
export async function getAppStorageInfo(transport: Transport): Promise<string> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "getAppStorageInfo",
  });
  tracer.trace("Start");

  const response = await transport.send(...GET_APP_STORAGE_INFO, RESPONSE_STATUS_SET);
  return parseResponse(response);
}

/**
 * Parses the response data from the device into a string.
 *
 * @param data - The response data received from the device.
 * @returns A string representing the parsed response.
 */
function parseResponse(data: Buffer): string {
  return data.toString("utf-8");
}
