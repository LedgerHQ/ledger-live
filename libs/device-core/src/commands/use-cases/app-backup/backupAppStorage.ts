import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import type { APDU } from "../../entities/APDU";
import {
  GenerateAesKeyFailed,
  InternalComputeAesCmacFailed,
  InternalCryptoOperationFailed,
  InvalidBackupState,
  InvalidContext,
} from "../../../errors";

/**
 * Name in documentation: INS_APP_STORAGE_BACKUP
 * cla: 0xe0
 * ins: 0x6b
 * p1: 0x00
 * p2: 0x00
 * lc: 0x00
 */
const BACKUP_APP_STORAGE = [0xe0, 0x6b, 0x00, 0x00] as const;

/**
 * 0x9000: Success.
 * 0x5123: Invalid context, Get Info must be called.
 * 0x5419: Failed to generate AES key.
 * 0x541A: Internal error, crypto operation failed.
 * 0x541B: Internal error, failed to compute AES CMAC.
 * 0x541C: Failed to encrypt the app storage backup.
 * 0x662F: Invalid device state, recovery mode.
 * 0x6642: Invalid backup state, backup already performed.
 */
const RESPONSE_STATUS_SET: number[] = [
  StatusCodes.OK,
  StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
  StatusCodes.GEN_AES_KEY_FAILED,
  StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED,
  StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED,
  StatusCodes.ENCRYPT_APP_STORAGE_FAILED,
  StatusCodes.DEVICE_IN_RECOVERY_MODE,
  StatusCodes.INVALID_BACKUP_STATE,
];

/**
 * Retrieves the app storage information (chunk) from the device and returns it
 * as a buffer.
 *
 * @param transport - The transport object used to communicate with the device.
 * @returns A promise that resolves to the app storage information as a buffer.
 */
export async function backupAppStorage(transport: Transport): Promise<Buffer> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "backupAppStorage",
  });
  tracer.trace("Start");

  const apdu: Readonly<APDU> = [...BACKUP_APP_STORAGE, Buffer.from([0x00])];

  const response = await transport.send(...apdu, RESPONSE_STATUS_SET);

  return parseResponse(response);
}

/**
 * Parses the response data buffer, check the status code and return the data.
 *
 * @param data - The response data buffer w/ status code.
 * @returns The response data as a buffer w/o status code.
 */
export function parseResponse(data: Buffer): Buffer {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@backupAppStorage",
  });
  const status = data.readUInt16BE(data.length - 2);
  tracer.trace("Result status from 0xe06b0000", { status });

  switch (status) {
    case StatusCodes.OK:
      return data.subarray(0, data.length - 2);
    case StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT:
      throw new InvalidContext("Invalid context, getAppStorageInfo must be called.");
    case StatusCodes.GEN_AES_KEY_FAILED:
      throw new GenerateAesKeyFailed("Failed to generate AES key.");
    case StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED:
      throw new InternalCryptoOperationFailed("Internal error, crypto operation failed.");
    case StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED:
      throw new InternalComputeAesCmacFailed("Internal error, failed to compute AES CMAC.");
    case StatusCodes.ENCRYPT_APP_STORAGE_FAILED:
      throw new GenerateAesKeyFailed("Failed to encrypt the app storage backup.");
    case StatusCodes.DEVICE_IN_RECOVERY_MODE:
      break;
    case StatusCodes.INVALID_BACKUP_STATE:
      throw new InvalidBackupState("Invalid backup state, backup already performed.");
  }

  throw new TransportStatusError(status);
}
