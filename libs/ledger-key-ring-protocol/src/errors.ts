export class ScannedOldImportQrCode extends Error {
  override name = "ScannedOldImportQrCode";
}
export class ScannedNewImportQrCode extends Error {
  override name = "ScannedNewImportQrCode";
}
export class ScannedInvalidQrCode extends Error {
  override name = "ScannedInvalidQrCode";
}
export class InvalidDigitsError extends Error {
  override name = "InvalidDigitsError";
}
export class InvalidEncryptionKeyError extends Error {
  override name = "InvalidEncryptionKeyError";
}
export class TrustchainEjected extends Error {
  override name = "TrustchainEjected";
}
export class TrustchainNotAllowed extends Error {
  override name = "TrustchainNotAllowed";
}
export class TrustchainOutdated extends Error {
  override name = "TrustchainOutdated";
}
export class TrustchainNotFound extends Error {
  override name = "TrustchainNotFound";
}
export class NoTrustchainInitialized extends Error {
  override name = "NoTrustchainInitialized";
}
export class TrustchainAlreadyInitialized extends Error {
  override name = "TrustchainAlreadyInitialized";
}
export class TrustchainAlreadyInitializedWithOtherSeed extends Error {
  override name = "TrustchainAlreadyInitializedWithOtherSeed";
}

export class QRCodeWSClosed extends Error {
  override name = "QRCodeWSClosed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
