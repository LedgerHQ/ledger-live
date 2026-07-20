export class HederaAddAccountError extends Error {
  override name = "HederaAddAccountError";
  constructor(message?: string) {
    super(message || "HederaAddAccountError");
  }
}

export class HederaRecipientInvalidChecksum extends Error {
  override name = "HederaRecipientInvalidChecksum";
  constructor(message?: string) {
    super(message || "HederaRecipientInvalidChecksum");
  }
}

export class HederaInsufficientFundsForAssociation extends Error {
  override name = "HederaInsufficientFundsForAssociation";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaInsufficientFundsForAssociation");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaRecipientTokenAssociationRequired extends Error {
  override name = "HederaRecipientTokenAssociationRequired";
  constructor(message?: string) {
    super(message || "HederaRecipientTokenAssociationRequired");
  }
}

export class HederaRecipientTokenAssociationUnverified extends Error {
  override name = "HederaRecipientTokenAssociationUnverified";
  constructor(message?: string) {
    super(message || "HederaRecipientTokenAssociationUnverified");
  }
}

export class HederaRecipientEvmAddressVerificationRequired extends Error {
  override name = "HederaRecipientEvmAddressVerificationRequired";
  constructor(message?: string) {
    super(message || "HederaRecipientEvmAddressVerificationRequired");
  }
}

export class HederaRedundantStakingNodeIdError extends Error {
  override name = "HederaRedundantStakingNodeIdError";
  constructor(message?: string) {
    super(message || "HederaRedundantStakingNodeIdError");
  }
}

export class HederaInvalidStakingNodeIdError extends Error {
  override name = "HederaInvalidStakingNodeIdError";
  constructor(message?: string) {
    super(message || "HederaInvalidStakingNodeIdError");
  }
}

export class HederaNoStakingRewardsError extends Error {
  override name = "HederaNoStakingRewardsError";
  constructor(message?: string) {
    super(message || "HederaNoStakingRewardsError");
  }
}

export class HederaMemoExceededSizeError extends Error {
  override name = "HederaMemoExceededSizeError";
  constructor(message?: string) {
    super(message || "HederaMemoExceededSizeError");
  }
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ClaimRewardsFeesWarning");
    if (fields) Object.assign(this, fields);
  }
}
