export enum HwTransportErrorType {
  Unknown = "Unknown",
  LocationServicesDisabled = "LocationServicesDisabled",
  LocationServicesUnauthorized = "LocationServicesUnauthorized",
  BluetoothScanStartFailed = "BluetoothScanStartFailed",
}

export class HwTransportError extends Error {
  [key: string]: unknown;
  type: HwTransportErrorType;

  constructor(type: HwTransportErrorType, message: string) {
    super(message || "HwTransportError");
    this.name = "HwTransportError";
    this.type = type;
    Object.setPrototypeOf(this, HwTransportError.prototype);
  }
}

export class TransportError extends Error {
  [key: string]: unknown;
  id: string;
  constructor(message: string, id: string) {
    const name = "TransportError";
    super(message || name);
    this.name = name;
    this.message = message;
    this.stack = new Error(message).stack;
    this.id = id;
  }
}

export const StatusCodes = {
  ACCESS_CONDITION_NOT_FULFILLED: 0x9804,
  ALGORITHM_NOT_SUPPORTED: 0x9484,
  CLA_NOT_SUPPORTED: 0x6e00,
  CLA_NOT_SUPPORTED_BOOTLOADER: 0x6e01,
  CODE_BLOCKED: 0x9840,
  CODE_NOT_INITIALIZED: 0x9802,
  COMMAND_INCOMPATIBLE_FILE_STRUCTURE: 0x6981,
  CONDITIONS_OF_USE_NOT_SATISFIED: 0x6985,
  CONTRADICTION_INVALIDATION: 0x9810,
  CONTRADICTION_SECRET_CODE_STATUS: 0x9808,
  DEVICE_IN_RECOVERY_MODE: 0x662f,
  CUSTOM_IMAGE_EMPTY: 0x662e,
  FILE_ALREADY_EXISTS: 0x6a89,
  FILE_NOT_FOUND: 0x9404,
  GP_AUTH_FAILED: 0x6300,
  HALTED: 0x6faa,
  INCONSISTENT_FILE: 0x9408,
  INCORRECT_DATA: 0x6a80,
  INCORRECT_LENGTH: 0x6700,
  INCORRECT_P1_P2: 0x6b00,
  INS_NOT_SUPPORTED: 0x6d00,
  DEVICE_NOT_ONBOARDED: 0x6d07,
  DEVICE_NOT_ONBOARDED_2: 0x6611,
  INVALID_KCV: 0x9485,
  INVALID_OFFSET: 0x9402,
  LICENSING: 0x6f42,
  LOCKED_DEVICE: 0x5515,
  MAX_VALUE_REACHED: 0x9850,
  MEMORY_PROBLEM: 0x9240,
  MISSING_CRITICAL_PARAMETER: 0x6800,
  NO_EF_SELECTED: 0x9400,
  NOT_ENOUGH_MEMORY_SPACE: 0x6a84,
  OK: 0x9000,
  PIN_REMAINING_ATTEMPTS: 0x63c0,
  REFERENCED_DATA_NOT_FOUND: 0x6a88,
  SECURITY_STATUS_NOT_SATISFIED: 0x6982,
  TECHNICAL_PROBLEM: 0x6f00,
  UNKNOWN_APDU: 0x6d02,
  USER_REFUSED_ON_DEVICE: 0x5501,
  NOT_ENOUGH_SPACE: 0x5102,
  APP_NOT_FOUND_OR_INVALID_CONTEXT: 0x5123,
  INVALID_APP_NAME_LENGTH: 0x670a,
  GEN_AES_KEY_FAILED: 0x5419,
  INTERNAL_CRYPTO_OPERATION_FAILED: 0x541a,
  INTERNAL_COMPUTE_AES_CMAC_FAILED: 0x541b,
  ENCRYPT_APP_STORAGE_FAILED: 0x541c,
  INVALID_BACKUP_STATE: 0x6642,
  PIN_NOT_SET: 0x5502,
  INVALID_BACKUP_LENGTH: 0x6733,
  INVALID_RESTORE_STATE: 0x6643,
  INVALID_CHUNK_LENGTH: 0x6734,
  INVALID_BACKUP_HEADER: 0x684a,
  SW_BAD_STATE: 0xb007,
};

export function getAltStatusMessage(code: number): string | undefined | null {
  switch (code) {
    case 0x6700:
      return "Incorrect length";
    case 0x6800:
      return "Missing critical parameter";
    case 0x6982:
      return "Security not satisfied (dongle locked or have invalid access rights)";
    case 0x6985:
      return "Condition of use not satisfied (denied by the user?)";
    case 0x6a80:
      return "Invalid data received";
    case 0x6b00:
      return "Invalid parameter received";
    case 0x5515:
      return "Locked device";
    case 0xb007:
      return "Unexpected state on the device";
  }
  if (0x6f00 <= code && code <= 0x6fff) {
    return "Internal error, please report";
  }
}

export class TransportStatusError extends Error {
  [key: string]: unknown;
  statusCode: number;
  statusText: string;

  constructor(
    statusCode: number,
    { canBeMappedToChildError = true }: { canBeMappedToChildError?: boolean } = {},
  ) {
    const statusText =
      Object.keys(StatusCodes).find(k => StatusCodes[k] === statusCode) || "UNKNOWN_ERROR";
    const smsg = getAltStatusMessage(statusCode) || statusText;
    const statusCodeStr = statusCode.toString(16);
    const message = `Ledger device: ${smsg} (0x${statusCodeStr})`;

    super(message || "TransportStatusError");
    this.name = "TransportStatusError";

    this.statusCode = statusCode;
    this.statusText = statusText;

    Object.setPrototypeOf(this, TransportStatusError.prototype);

    if (canBeMappedToChildError && statusCode === StatusCodes.LOCKED_DEVICE) {
      return new LockedDeviceError(message);
    }
  }
}

export class LockedDeviceError extends TransportStatusError {
  constructor(message?: string) {
    super(StatusCodes.LOCKED_DEVICE, { canBeMappedToChildError: false });
    if (message) {
      this.message = message;
    }
    this.name = "LockedDeviceError";
    Object.setPrototypeOf(this, LockedDeviceError.prototype);
  }
}

export class DeviceMangementKitError extends Error {
  [key: string]: unknown;
  constructor(name: string, message: string) {
    super(message || "DeviceMangementKitError");
    this.name = name;
    Object.setPrototypeOf(this, DeviceMangementKitError.prototype);
  }
}

export type TransportStatusErrorClassType = typeof TransportStatusError | typeof LockedDeviceError;

export class BluetoothRequired extends Error {
  override name = "BluetoothRequired";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "BluetoothRequired");
  }
}

export class CantOpenDevice extends Error {
  override name = "CantOpenDevice";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "CantOpenDevice");
  }
}

export class DisconnectedDevice extends Error {
  override name = "DisconnectedDevice";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "DisconnectedDevice");
  }
}

export class DisconnectedDeviceDuringOperation extends Error {
  override name = "DisconnectedDeviceDuringOperation";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "DisconnectedDeviceDuringOperation");
  }
}

export class TransportOpenUserCancelled extends Error {
  override name = "TransportOpenUserCancelled";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "TransportOpenUserCancelled");
  }
}

export class TransportInterfaceNotAvailable extends Error {
  override name = "TransportInterfaceNotAvailable";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "TransportInterfaceNotAvailable");
  }
}

export class TransportRaceCondition extends Error {
  override name = "TransportRaceCondition";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "TransportRaceCondition");
  }
}

export class TransportWebUSBGestureRequired extends Error {
  override name = "TransportWebUSBGestureRequired";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "TransportWebUSBGestureRequired");
  }
}

export class TransportExchangeTimeoutError extends Error {
  override name = "TransportExchangeTimeoutError";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "TransportExchangeTimeoutError");
  }
}

export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "UserRefusedOnDevice");
  }
}

export class UserRefusedAddress extends Error {
  override name = "UserRefusedAddress";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "UserRefusedAddress");
  }
}
