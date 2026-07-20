export class ScannedOldImportQrCode extends Error {
  override name = "ScannedOldImportQrCode";
  constructor(message?: string) {
    super(message || "ScannedOldImportQrCode");
  }
}
export class ScannedNewImportQrCode extends Error {
  override name = "ScannedNewImportQrCode";
  constructor(message?: string) {
    super(message || "ScannedNewImportQrCode");
  }
}
export class ScannedInvalidQrCode extends Error {
  override name = "ScannedInvalidQrCode";
  constructor(message?: string) {
    super(message || "ScannedInvalidQrCode");
  }
}
export class InvalidDigitsError extends Error {
  override name = "InvalidDigitsError";
  constructor(message?: string) {
    super(message || "InvalidDigitsError");
  }
}
export class InvalidEncryptionKeyError extends Error {
  override name = "InvalidEncryptionKeyError";
  constructor(message?: string) {
    super(message || "InvalidEncryptionKeyError");
  }
}
export class TrustchainEjected extends Error {
  override name = "TrustchainEjected";
  constructor(message?: string) {
    super(message || "TrustchainEjected");
  }
}
export class TrustchainNotAllowed extends Error {
  override name = "TrustchainNotAllowed";
  constructor(message?: string) {
    super(message || "TrustchainNotAllowed");
  }
}
export class TrustchainOutdated extends Error {
  override name = "TrustchainOutdated";
  constructor(message?: string) {
    super(message || "TrustchainOutdated");
  }
}
export class TrustchainNotFound extends Error {
  override name = "TrustchainNotFound";
  constructor(message?: string) {
    super(message || "TrustchainNotFound");
  }
}
export class NoTrustchainInitialized extends Error {
  override name = "NoTrustchainInitialized";
  constructor(message?: string) {
    super(message || "NoTrustchainInitialized");
  }
}
export class TrustchainAlreadyInitialized extends Error {
  override name = "TrustchainAlreadyInitialized";
  constructor(message?: string) {
    super(message || "TrustchainAlreadyInitialized");
  }
}
export class TrustchainAlreadyInitializedWithOtherSeed extends Error {
  override name = "TrustchainAlreadyInitializedWithOtherSeed";
  constructor(message?: string) {
    super(message || "TrustchainAlreadyInitializedWithOtherSeed");
  }
}

export class QRCodeWSClosed extends Error {
  override name = "QRCodeWSClosed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "QRCodeWSClosed");
    if (fields) Object.assign(this, fields);
  }
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "LedgerAPI4xx");
    if (fields) Object.assign(this, fields);
  }
}
