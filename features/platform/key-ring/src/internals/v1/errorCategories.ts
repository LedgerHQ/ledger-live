import type { KeyRingErrorCategory } from "../../types";

/**
 * The v1 SDK, its QR code pairing and its network layer name their errors. The adapter maps them to
 * `KeyRingError`s by these names, which also survive a lost prototype.
 */
export const V1_ERROR_CATEGORIES: ReadonlyMap<string, KeyRingErrorCategory> = new Map([
  ["TrustchainEjected", "member-removed"],
  ["TrustchainNotAllowed", "not-allowed"],
  ["TrustchainNotFound", "tree-not-found"],
  ["NoTrustchainInitialized", "no-tree-for-seed"],
  ["TrustchainOutdated", "outdated"],
  ["TrustchainAlreadyInitialized", "already-member"],
  ["TrustchainAlreadyInitializedWithOtherSeed", "member-of-other-tree"],
  ["UserRefusedOnDevice", "user-refused"],
  ["NetworkDown", "network"],
  ["LedgerAPI5xx", "network"],
  ["QRCodeWSClosed", "pairing-closed"],
  ["InvalidDigitsError", "pairing-invalid-code"],
  ["QRCodeProtocolError", "pairing-protocol"],
  ["ScannedOldImportQrCode", "pairing-outdated-qr-code"],
  ["ScannedNewImportQrCode", "pairing-newer-qr-code"],
  ["ScannedInvalidQrCode", "pairing-invalid-qr-code"],
  // A KeyRingError that lost its prototype keeps its name.
  ["KeyRingMemberRemovedError", "member-removed"],
  ["KeyRingTreeNotFoundError", "tree-not-found"],
  ["KeyRingOutdatedError", "outdated"],
  ["KeyRingNotAllowedError", "not-allowed"],
  ["KeyRingNetworkError", "network"],
  ["KeyRingDeviceUnsupportedError", "device-unsupported"],
  ["KeyRingPairingClosedError", "pairing-closed"],
]);
