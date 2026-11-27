import type { KeyRingErrorCategory } from "../../types";

/**
 * The category of a v1 error from its name, or, for a `LedgerAPI4xx` of the key ring backend,
 * from its message. Undefined for any other error.
 */
export function v1ErrorCategory(
  name: string,
  message: string | undefined,
): KeyRingErrorCategory | undefined {
  const named = V1_ERROR_CATEGORIES.get(name);
  if (named || name !== API_4XX_NAME || message === undefined) return named;
  return API_4XX_CATEGORIES.find(([fragment]) => message.includes(fragment))?.[1];
}

/**
 * The v1 SDK, its QR code pairing and its network layer name their errors. The adapter maps them to
 * `KeyRingError`s by these names, which also survive a lost prototype.
 */
const V1_ERROR_CATEGORIES: ReadonlyMap<string, KeyRingErrorCategory> = new Map([
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

const API_4XX_NAME = "LedgerAPI4xx";

// The key ring backend states these refusals in the message of a 4xx only.
const API_4XX_CATEGORIES: ReadonlyArray<readonly [string, KeyRingErrorCategory]> = [
  ["No such trustchain", "tree-not-found"],
  ["Not a member of trustchain", "not-member"],
  ["You are not member", "not-member"],
];
