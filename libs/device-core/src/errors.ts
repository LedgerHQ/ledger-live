// 0x5123
export class AppNotFound extends Error {
  override name = "AppNotFound";
  constructor(message?: string) {
    super(message || "AppNotFound");
  }
}
export class InvalidContext extends Error {
  override name = "InvalidContext";
  constructor(message?: string) {
    super(message || "InvalidContext");
  }
}
// 0x670a
export class InvalidAppNameLength extends Error {
  override name = "InvalidAppNameLength";
  constructor(message?: string) {
    super(message || "InvalidAppNameLength");
  }
}
// 0x5419
export class GenerateAesKeyFailed extends Error {
  override name = "GenerateAesKeyFailed";
  constructor(message?: string) {
    super(message || "GenerateAesKeyFailed");
  }
}
// 0x541a
export class InternalCryptoOperationFailed extends Error {
  override name = "InternalCryptoOperationFailed";
  constructor(message?: string) {
    super(message || "InternalCryptoOperationFailed");
  }
}
// 0x541b
export class InternalComputeAesCmacFailed extends Error {
  override name = "InternalComputeAesCmacFailed";
  constructor(message?: string) {
    super(message || "InternalComputeAesCmacFailed");
  }
}
// 0x541c
export class EncryptAppStorageFailed extends Error {
  override name = "EncryptAppStorageFailed";
  constructor(message?: string) {
    super(message || "EncryptAppStorageFailed");
  }
}
// 0x5502
export class PinNotSet extends Error {
  override name = "PinNotSet";
  constructor(message?: string) {
    super(message || "PinNotSet");
  }
}
// 0x684a
export class InvalidBackupHeader extends Error {
  override name = "InvalidBackupHeader";
  constructor(message?: string) {
    super(message || "InvalidBackupHeader");
  }
}
// 0x6733
export class InvalidBackupLength extends Error {
  override name = "InvalidBackupLength";
  constructor(message?: string) {
    super(message || "InvalidBackupLength");
  }
}
// 0x6642
export class InvalidBackupState extends Error {
  override name = "InvalidBackupState";
  constructor(message?: string) {
    super(message || "InvalidBackupState");
  }
}
// 0x6643
export class InvalidRestoreState extends Error {
  override name = "InvalidRestoreState";
  constructor(message?: string) {
    super(message || "InvalidRestoreState");
  }
}
// 0x6734
export class InvalidChunkLength extends Error {
  override name = "InvalidChunkLength";
  constructor(message?: string) {
    super(message || "InvalidChunkLength");
  }
}
// 0x5501
export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
  constructor(message?: string) {
    super(message || "UserRefusedOnDevice");
  }
}

export class FirmwareNotRecognized extends Error {
  override name = "FirmwareNotRecognized";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FirmwareNotRecognized");
    if (fields) Object.assign(this, fields);
  }
}

export class NetworkDown extends Error {
  override name = "NetworkDown";
  constructor(message?: string) {
    super(message || "NetworkDown");
  }
}

export class UnknownMCU extends Error {
  override name = "UnknownMCU";
  constructor(message?: string) {
    super(message || "UnknownMCU");
  }
}
