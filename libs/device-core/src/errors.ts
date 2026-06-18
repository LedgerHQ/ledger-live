// 0x5123
export class AppNotFound extends Error {
  override name = "AppNotFound";
  constructor(message = "AppNotFound") {
    super(message);
  }
}
export class InvalidContext extends Error {
  override name = "InvalidContext";
  constructor(message = "InvalidContext") {
    super(message);
  }
}
// 0x670a
export class InvalidAppNameLength extends Error {
  override name = "InvalidAppNameLength";
  constructor(message = "InvalidAppNameLength") {
    super(message);
  }
}
// 0x5419
export class GenerateAesKeyFailed extends Error {
  override name = "GenerateAesKeyFailed";
  constructor(message = "GenerateAesKeyFailed") {
    super(message);
  }
}
// 0x541a
export class InternalCryptoOperationFailed extends Error {
  override name = "InternalCryptoOperationFailed";
  constructor(message = "InternalCryptoOperationFailed") {
    super(message);
  }
}
// 0x541b
export class InternalComputeAesCmacFailed extends Error {
  override name = "InternalComputeAesCmacFailed";
  constructor(message = "InternalComputeAesCmacFailed") {
    super(message);
  }
}
// 0x541c
export class EncryptAppStorageFailed extends Error {
  override name = "EncryptAppStorageFailed";
  constructor(message = "EncryptAppStorageFailed") {
    super(message);
  }
}
// 0x5502
export class PinNotSet extends Error {
  override name = "PinNotSet";
  constructor(message = "PinNotSet") {
    super(message);
  }
}
// 0x684a
export class InvalidBackupHeader extends Error {
  override name = "InvalidBackupHeader";
  constructor(message = "InvalidBackupHeader") {
    super(message);
  }
}
// 0x6733
export class InvalidBackupLength extends Error {
  override name = "InvalidBackupLength";
  constructor(message = "InvalidBackupLength") {
    super(message);
  }
}
// 0x6642
export class InvalidBackupState extends Error {
  override name = "InvalidBackupState";
  constructor(message = "InvalidBackupState") {
    super(message);
  }
}
// 0x6643
export class InvalidRestoreState extends Error {
  override name = "InvalidRestoreState";
  constructor(message = "InvalidRestoreState") {
    super(message);
  }
}
// 0x6734
export class InvalidChunkLength extends Error {
  override name = "InvalidChunkLength";
  constructor(message = "InvalidChunkLength") {
    super(message);
  }
}
// 0x5501
export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
  constructor(message = "UserRefusedOnDevice") {
    super(message);
  }
}
