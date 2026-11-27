import type { KeyRingErrorCategory } from "../types";

/**
 * The name both apps translate each category under (`errors.<name>` in their i18n). The names come
 * from the v1 protocol errors; the translations keep them so the screens do not change.
 */
export const TRANSLATION_NAMES: Readonly<Record<KeyRingErrorCategory, string>> = {
  "member-removed": "TrustchainEjected",
  "not-allowed": "TrustchainNotAllowed",
  // The backend reports it as a 4xx, which both apps translate with its message.
  "not-member": "LedgerAPI4xx",
  "tree-not-found": "TrustchainNotFound",
  "no-tree-for-seed": "NoTrustchainInitialized",
  outdated: "TrustchainOutdated",
  "already-member": "TrustchainAlreadyInitialized",
  "member-of-other-tree": "TrustchainAlreadyInitializedWithOtherSeed",
  "user-refused": "UserRefusedOnDevice",
  "device-unsupported": "KeyRingDeviceUnsupportedError",
  network: "NetworkDown",
  "pairing-closed": "QRCodeWSClosed",
  "pairing-invalid-code": "InvalidDigitsError",
  "pairing-protocol": "QRCodeProtocolError",
  "pairing-outdated-qr-code": "ScannedOldImportQrCode",
  "pairing-newer-qr-code": "ScannedNewImportQrCode",
  "pairing-invalid-qr-code": "ScannedInvalidQrCode",
};
