import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import type { APDU } from "../../entities/APDU";
import {
  GenerateAesKeyFailed,
  InternalComputeAesCmacFailed,
  InvalidChunkLength,
  InvalidContext,
} from "../../../errors";

/**
 * Name in documentation: INS_APP_STORAGE_RESTORE_COMMIT
 * cla: 0xe0
 * ins: 0x6e
 * p1: 0x00
 * p2: 0x00
 * lc: 0x00
 */
const RESTORE_APP_STORAGE_COMMIT = [0xe0, 0x6e, 0x00, 0x00] as const;

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
  StatusCodes.GEN_AES_KEY_FAILED,
  StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED,
  StatusCodes.DEVICE_IN_RECOVERY_MODE,
  StatusCodes.INVALID_CHUNK_LENGTH,
];

/**
 * Restores the application storage commit.
 *
 * @param transport - The transport object used for communication with the device.
 * @returns A promise that resolves to void.
 */

export async function restoreAppStorageCommit(transport: Transport): Promise<void> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "restoreAppStorageCommit",
  });
  tracer.trace("Start");

  const apdu: Readonly<APDU> = [...RESTORE_APP_STORAGE_COMMIT, Buffer.from([0x00])];

  const response = await transport.send(...apdu, RESPONSE_STATUS_SET);

  parseResponse(response);
}

export function parseResponse(data: Buffer): void {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@restoreAppStorageCommit",
  });
  const status = data.readUInt16BE(data.length - 2);
  tracer.trace("Result status from 0xe06e0000", { status });

  switch (status) {
    case StatusCodes.OK:
      return;
    case StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT:
      throw new InvalidContext("Invalid context, restoreAppStorageInit must be called first.");
    case StatusCodes.GEN_AES_KEY_FAILED:
      throw new GenerateAesKeyFailed("Internal error, crypto operation failed.");
    case StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED:
      throw new InternalComputeAesCmacFailed("Failed to verify backup authenticity.");
    case StatusCodes.DEVICE_IN_RECOVERY_MODE:
      break;
    case StatusCodes.INVALID_CHUNK_LENGTH:
      throw new InvalidChunkLength("Invalid size of the restored app storage.");
  }

  throw new TransportStatusError(status);
}
