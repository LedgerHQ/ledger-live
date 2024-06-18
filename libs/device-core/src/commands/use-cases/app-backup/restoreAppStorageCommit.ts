import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import type { APDU } from "../../entities/APDU";

/**
 * Name in documentation: INS_APP_STORAGE_RESTORE_COMMIT
 * cla: 0xe0
 * ins: 0x6e
 * p1: 0x00
 * p2: 0x00
 * lc: 0x00
 */
const RESTORE_APP_STORAGE_COMMIT: APDU = [0xe0, 0x6e, 0x00, 0x00, Buffer.from([0x00])];

/**
 * 0x9000: Success.
 * 0x5123: Invalid context, Restore Init must be called first.
 * 0x5419: Internal error, crypto operaiton failed.
 * 0x541B: Failed to verify backup authenticity.
 * 0x662F: Invalid device state, recovery mode.
 * 0x6734: Invalid size of the restored app storage.
 */
const RESPONSE_STATUS_SET: number[] = [
  StatusCodes.OK,
  StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
  StatusCodes.FAILED_GEN_AES_KEY,
  StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED,
  StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
  StatusCodes.INVALID_CHUNK_LEN,
];

/**
 * Restores the application storage commit.
 *
 * @param transport - The transport object used for communication with the device.
 * @returns A promise that resolves to a string representing the parsed response.
 * @throws {TransportStatusError} If the response status is invalid.
 */

export async function restoreAppStorageCommit(transport: Transport): Promise<void> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "restoreAppStorageCommit",
  });
  tracer.trace("Start");

  const response = await transport.send(...RESTORE_APP_STORAGE_COMMIT, RESPONSE_STATUS_SET);
  parseResponse(response);
}

function parseResponse(data: Buffer): void {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@restoreAppStorageCommit",
  });
  const status = data.readUInt16BE(data.length - 2);
  if (tracer) {
    tracer.trace("Result status from 0xe06e0000", { status });
  }

  if (status === StatusCodes.OK) {
    return;
  }

  throw new TransportStatusError(status);
}
