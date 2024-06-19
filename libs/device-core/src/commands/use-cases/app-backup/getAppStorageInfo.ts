import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import type { AppStorageInfo } from "../../entities/AppStorageInfo";
import type { APDU } from "../../entities/APDU";
import { AppNotFound, InvalidAppNameLength } from "../../../errors";

/**
 * Name in documentation: INS_APP_STORAGE_GET_INFO
 * cla: 0xe0
 * ins: 0x6a
 * p1: 0x00
 * p2: 0x00
 * data: APP_NAME_LEN (1 byte) + APP_NAME (variable) to configure at runtime
 */
const GET_APP_STORAGE_INFO = [0xe0, 0x6a, 0x00, 0x00] as const;

/**
 * 0x9000: Success.
 * 0x5123: Application not found.
 * 0x662F: If the device is in recovery mode.
 * 0x670A: Invalid application name length, two chars minimum.
 */
const RESPONSE_STATUS_SET: number[] = [
  StatusCodes.OK,
  StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
  StatusCodes.DEVICE_IN_RECOVERY_MODE,
  StatusCodes.INVALID_APP_NAME_LENGTH,
];

/**
 * Retrieves the application storage information from the device.
 *
 * @param transport - The transport object used to communicate with the device.
 * @param appName - The name of the application to retrieve the storage information for.
 * @returns A promise that resolves to the application storage information object.
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
  const apdu: Readonly<APDU> = [...GET_APP_STORAGE_INFO, params];

  const response = await transport.send(...apdu, RESPONSE_STATUS_SET);

  return parseResponse(response);
}

/**
 * Parses the response data from the device into a string.
 *
 * @param data - The response data received from the device.
 * @returns A string representing the parsed response.
 */
export function parseResponse(data: Buffer): AppStorageInfo {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@getAppStorageInfo",
  });
  const status = data.readUInt16BE(data.length - 2);
  tracer.trace("Result status from 0xe06a0000", { status });

  switch (status) {
    case StatusCodes.OK: {
      /**
       * The backup size is a 4-byte unsigned integer.
       * The data version is a 4-byte string.
       * The hasSettings and hasData flags are 1-byte booleans.
       * The hash is a 32-byte string.
       */
      let offset = 0;
      const size = data.readUInt32BE(offset); // Len = 4
      offset += 4;
      const dataVersion = data.subarray(offset, offset + 4).toString(); // Len = 4
      offset += 4;
      const hasSettings = data.readUIntBE(offset, 1) === 1; // Len = 1
      offset += 1;
      const hasData = data.readUIntBE(offset, 1) === 1; // Len = 1
      offset += 1;
      const hash = data.subarray(offset, offset + 32).toString(); // Len = 32

      return { size, dataVersion, hasSettings, hasData, hash };
    }
    case StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT:
      throw new AppNotFound("Application not found.");
    case StatusCodes.DEVICE_IN_RECOVERY_MODE:
      break;
    case StatusCodes.INVALID_APP_NAME_LENGTH:
      throw new InvalidAppNameLength("Invalid application name length, two chars minimum.");
  }

  throw new TransportStatusError(status);
}
