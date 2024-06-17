import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import { APDU } from "src/commands/entities/APDU";

/**
 * Name in documentation: INS_APP_STORAGE_GET_INFO
 * cla: 0xe0
 * ins: 0x6d
 * p1: 0x00
 * p2: 0x00
 * data: CHUNK_LEN + CHUNK
 */
const RESTORE_APP_STORAGE: APDU = [0xe0, 0x6d, 0x00, 0x00, undefined];

/**
 * 0x9000: Success.
 * 0x5123: Invalid context, Restore Init must be called first.
 * 0x5419: Failed to generate AES key.
 * 0x541A: Failed to decrypt the app storage backup.
 * 0x662F: Invalid device state, recovery mode.
 * 0x6643: Invalid restore state, restore already performed.
 * 0x6734: Invalid CHUNK_LEN.
 * 0x684A: Invalid backup, app storage header is not valid.
 */
const RESPONSE_STATUS_SET: number[] = [
  StatusCodes.OK,
  StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
  StatusCodes.FAILED_GEN_AES_KEY,
  StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED,
  StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
  StatusCodes.INVALID_RESTORE_STATE,
  StatusCodes.INVALID_CHUNK_LEN,
  StatusCodes.INVALID_BACKUP_HEADER,
];

/**
 * Restores the application storage.
 *
 * @param transport - The transport object used for communication with the device.
 * @param chunk - The chunk of data to restore.
 * @returns A promise that resolves to a string representing the parsed response.
 * @throws {TransportStatusError} If the response status is invalid.
 */
export async function restoreAppStorage(transport: Transport, chunk: string): Promise<void> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "restoreAppStorage",
  });
  tracer.trace("Start");

  const params = Buffer.concat([Buffer.from([chunk.length]), Buffer.from(chunk, "hex")]);
  RESTORE_APP_STORAGE[4] = params;

  const response = await transport.send(...RESTORE_APP_STORAGE, RESPONSE_STATUS_SET);
  parseResponse(response);
}

function parseResponse(data: Buffer): void {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@restoreAppStorage",
  });
  const status = data.readUInt16BE(data.length - 2);
  if (tracer) {
    tracer.trace("Result status from 0xe06d0000", { status });
  }

  if (status === StatusCodes.OK) {
    return;
  }

  throw new TransportStatusError(status);
}
