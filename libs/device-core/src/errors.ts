import { createCustomErrorClass } from "@ledgerhq/errors";

// 0x5123
export const AppNotFound = createCustomErrorClass("AppNotFound");
export const InvalidContext = createCustomErrorClass("InvalidContext");
// 0x670a
export const InvalidAppNameLength = createCustomErrorClass("InvalidAppNameLength");
// 0x5419
export const GenerateAesKeyFailed = createCustomErrorClass("GenerateAesKeyFailed");
// 0x541a
export const InternalCryptoOperationFailed = createCustomErrorClass(
  "InternalCryptoOperationFailed",
);
// 0x541b
export const InternalComputeAesCmacFailed = createCustomErrorClass("InternalComputeAesCmacFailed");
// 0x541c
export const EncryptAppStorageFailed = createCustomErrorClass("EncryptAppStorageFailed");
// 0x5502
export const PinNotSet = createCustomErrorClass("PinNotSet");
// 0x684a
export const InvalidBackupHeader = createCustomErrorClass("InvalidBackupHeader");
// 0x6733
export const InvalidBackupLength = createCustomErrorClass("InvalidBackupLength");
// 0x6642
export const InvalidBackupState = createCustomErrorClass("InvalidBackupState");
// 0x6643
export const InvalidRestoreState = createCustomErrorClass("InvalidRestoreState");
// 0x6734
export const InvalidChunkLength = createCustomErrorClass("InvalidChunkLength");
