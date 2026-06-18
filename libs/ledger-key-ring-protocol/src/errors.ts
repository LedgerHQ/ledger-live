export class ScannedOldImportQrCode extends Error {
  override name = "ScannedOldImportQrCode";
  constructor(message = "ScannedOldImportQrCode") {
    super(message);
  }
}
export class ScannedNewImportQrCode extends Error {
  override name = "ScannedNewImportQrCode";
  constructor(message = "ScannedNewImportQrCode") {
    super(message);
  }
}
export class ScannedInvalidQrCode extends Error {
  override name = "ScannedInvalidQrCode";
  constructor(message = "ScannedInvalidQrCode") {
    super(message);
  }
}
export class InvalidDigitsError extends Error {
  override name = "InvalidDigitsError";
  constructor(message = "InvalidDigitsError") {
    super(message);
  }
}
export class InvalidEncryptionKeyError extends Error {
  override name = "InvalidEncryptionKeyError";
  constructor(message = "InvalidEncryptionKeyError") {
    super(message);
  }
}
export class TrustchainEjected extends Error {
  override name = "TrustchainEjected";
  constructor(message = "TrustchainEjected") {
    super(message);
  }
}
export class TrustchainNotAllowed extends Error {
  override name = "TrustchainNotAllowed";
  constructor(message = "TrustchainNotAllowed") {
    super(message);
  }
}
export class TrustchainOutdated extends Error {
  override name = "TrustchainOutdated";
  constructor(message = "TrustchainOutdated") {
    super(message);
  }
}
export class TrustchainNotFound extends Error {
  override name = "TrustchainNotFound";
  constructor(message = "TrustchainNotFound") {
    super(message);
  }
}
export class NoTrustchainInitialized extends Error {
  override name = "NoTrustchainInitialized";
  constructor(message = "NoTrustchainInitialized") {
    super(message);
  }
}
export class TrustchainAlreadyInitialized extends Error {
  override name = "TrustchainAlreadyInitialized";
  constructor(message = "TrustchainAlreadyInitialized") {
    super(message);
  }
}
export class TrustchainAlreadyInitializedWithOtherSeed extends Error {
  override name = "TrustchainAlreadyInitializedWithOtherSeed";
  constructor(message = "TrustchainAlreadyInitializedWithOtherSeed") {
    super(message);
  }
}

export class QRCodeWSClosed extends Error {
  override name = "QRCodeWSClosed";
  declare time: number;
  constructor(message = "QRCodeWSClosed", fields?: { time: number }) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
