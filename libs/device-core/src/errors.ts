// 0x5123
export class AppNotFound extends Error {
  override name = "AppNotFound";
}
export class InvalidContext extends Error {
  override name = "InvalidContext";
}
// 0x670a
export class InvalidAppNameLength extends Error {
  override name = "InvalidAppNameLength";
}
// 0x5419
export class GenerateAesKeyFailed extends Error {
  override name = "GenerateAesKeyFailed";
}
// 0x541a
export class InternalCryptoOperationFailed extends Error {
  override name = "InternalCryptoOperationFailed";
}
// 0x541b
export class InternalComputeAesCmacFailed extends Error {
  override name = "InternalComputeAesCmacFailed";
}
// 0x541c
export class EncryptAppStorageFailed extends Error {
  override name = "EncryptAppStorageFailed";
}
// 0x5502
export class PinNotSet extends Error {
  override name = "PinNotSet";
}
// 0x684a
export class InvalidBackupHeader extends Error {
  override name = "InvalidBackupHeader";
}
// 0x6733
export class InvalidBackupLength extends Error {
  override name = "InvalidBackupLength";
}
// 0x6642
export class InvalidBackupState extends Error {
  override name = "InvalidBackupState";
}
// 0x6643
export class InvalidRestoreState extends Error {
  override name = "InvalidRestoreState";
}
// 0x6734
export class InvalidChunkLength extends Error {
  override name = "InvalidChunkLength";
}
// 0x5501
export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
}

export class FirmwareNotRecognized extends Error {
  override name = "FirmwareNotRecognized";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NetworkDown extends Error {
  override name = "NetworkDown";
}

export class UnknownMCU extends Error {
  override name = "UnknownMCU";
}
