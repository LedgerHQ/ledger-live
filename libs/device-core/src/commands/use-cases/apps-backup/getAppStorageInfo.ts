import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import { APDU } from "src/commands/entities/APDU";
import { AppStorageInfo } from "src/commands/entities/AppStorageInfo";

/**
 * Name in documentation: INS_APP_STORAGE_GET_INFO
 * cla: 0xe0
 * ins: 0x6a
 * p1: 0x00
 * p2: 0x00
 * data: APP_NAME_LEN (1 byte) + APP_NAME (variable)
 */
const GET_APP_STORAGE_INFO: APDU = [0xe0, 0x6a, 0x00, 0x00, undefined];

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
 * Retrieves the application storage information from the device.
 *
 * @param transport - The transport object used to communicate with the device.
 * @param appName - The name of the application to retrieve the storage information for.
 * @returns A promise that resolves to the application storage information.
 * @throws {TransportStatusError} If the response status is invalid.
 */
export async function getAppStorageInfo(
  transport: Transport,
  appName: string,
): Promise<AppStorageInfo> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "getAppStorageInfo",
  });
  tracer.trace("Start");

  const params: Buffer = Buffer.concat([
    Buffer.from([appName.length]),
    Buffer.from(appName, "ascii"),
  ]);
  GET_APP_STORAGE_INFO[4] = params;

  const response = await transport.send(...GET_APP_STORAGE_INFO, RESPONSE_STATUS_SET);
  return parseResponse(response);
}

/**
 * Parses the response data from the device into a string.
 *
 * @param data - The response data received from the device.
 * @returns A string representing the parsed response.
 */
function parseResponse(data: Buffer): AppStorageInfo {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@getAppStorageInfo",
  });
  const status = data.readUInt16BE(data.length - 2);
  if (tracer) {
    tracer.trace("Result status from 0xe06a0000", { status });
  }

  if (status === StatusCodes.OK) {
    const size = data.readUInt32BE(0); // Len = 4
    const version = data.readUIntBE(4, 4).toString(); // Len = 4
    const hasSettings = data.readUIntBE(8, 1) === 1; // Len = 1
    const hasData = data.readUIntBE(9, 1) === 1; // Len = 1
    const hash = data.subarray(12, 33).toString("hex"); // Len = 20
    return { size, version, hasSettings, hasData, hash };
  }

  throw new TransportStatusError(status);
}
