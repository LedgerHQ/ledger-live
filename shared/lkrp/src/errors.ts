export class LkrpError extends Error {
  override name = "LkrpError";
}

export class LkrpNotImplementedError extends LkrpError {
  override name = "LkrpNotImplementedError";

  constructor(operation: string) {
    super(`LKRP operation is not implemented: ${operation}`);
  }
}

export class TrustchainEjected extends LkrpError {
  override name = "TrustchainEjected";
}

export class TrustchainNotAllowed extends LkrpError {
  override name = "TrustchainNotAllowed";
}

export class TrustchainOutdated extends LkrpError {
  override name = "TrustchainOutdated";
}

export class TrustchainNotFound extends LkrpError {
  override name = "TrustchainNotFound";
}

export class NoTrustchainInitialized extends LkrpError {
  override name = "NoTrustchainInitialized";
}

export class TrustchainAlreadyInitialized extends LkrpError {
  override name = "TrustchainAlreadyInitialized";
}

export class TrustchainAlreadyInitializedWithOtherSeed extends LkrpError {
  override name = "TrustchainAlreadyInitializedWithOtherSeed";
}

export class InvalidEncryptionKeyError extends LkrpError {
  override name = "InvalidEncryptionKeyError";
}
