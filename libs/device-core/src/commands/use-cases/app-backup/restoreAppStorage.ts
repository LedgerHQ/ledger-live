import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import type { APDU } from "../../entities/APDU";
import {
  GenerateAesKeyFailed,
  InternalCryptoOperationFailed,
  InvalidBackupHeader,
  InvalidChunkLength,
  InvalidContext,
  InvalidRestoreState,
} from "../../../errors";

/**
 * Name in documentation: INS_APP_STORAGE_GET_INFO
 * cla: 0xe0
 * ins: 0x6d
 * p1: 0x00
 * p2: 0x00
 * data: CHUNK_LEN + CHUNK to configure at runtime
 */
const RESTORE_APP_STORAGE = [0xe0, 0x6d, 0x00, 0x00] as const;

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
  StatusCodes.GEN_AES_KEY_FAILED,
  StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED,
  StatusCodes.DEVICE_IN_RECOVERY_MODE,
  StatusCodes.INVALID_RESTORE_STATE,
  StatusCodes.INVALID_CHUNK_LENGTH,
  StatusCodes.INVALID_BACKUP_HEADER,
];

/**
 * Restores the application storage.
 *
 * @param transport - The transport object used for communication with the device.
 * @param chunk - The chunk of data to restore.
 * @returns A promise that resolves to void.
 */
export async function restoreAppStorage(transport: Transport, chunk: Buffer): Promise<void> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "restoreAppStorage",
  });
  tracer.trace("Start");

  const params = Buffer.concat([Buffer.from([chunk.length]), chunk]);
  const apdu: Readonly<APDU> = [...RESTORE_APP_STORAGE, params];

  const response = await transport.send(...apdu, RESPONSE_STATUS_SET);

  parseResponse(response);
}

export function parseResponse(data: Buffer): void {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@restoreAppStorage",
  });
  const status = data.readUInt16BE(data.length - 2);
  tracer.trace("Result status from 0xe06d0000", { status });

  switch (status) {
    case StatusCodes.OK:
      return;
    case StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT:
      throw new InvalidContext("Invalid context, restoreAppStorageInit must be called first.");
    case StatusCodes.GEN_AES_KEY_FAILED:
      throw new GenerateAesKeyFailed("Failed to generate AES key.");
    case StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED:
      throw new InternalCryptoOperationFailed("Failed to decrypt the app storage backup.");
    case StatusCodes.DEVICE_IN_RECOVERY_MODE:
      break;
    case StatusCodes.INVALID_RESTORE_STATE:
      throw new InvalidRestoreState("Invalid restore state, restore already performed.");
    case StatusCodes.INVALID_CHUNK_LENGTH:
      throw new InvalidChunkLength("Invalid chunk length.");
    case StatusCodes.INVALID_BACKUP_HEADER:
      throw new InvalidBackupHeader("Invalid backup, app storage header is not valid.");
  }

  throw new TransportStatusError(status);
}
