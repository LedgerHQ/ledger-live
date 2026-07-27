export class HederaAddAccountError extends Error {
  override name = "HederaAddAccountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaAddAccountError");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaRecipientInvalidChecksum extends Error {
  override name = "HederaRecipientInvalidChecksum";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaRecipientInvalidChecksum");
    if (fields) Object.assign(this, fields);
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
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaRecipientTokenAssociationRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaRecipientTokenAssociationUnverified extends Error {
  override name = "HederaRecipientTokenAssociationUnverified";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaRecipientTokenAssociationUnverified");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaRecipientEvmAddressVerificationRequired extends Error {
  override name = "HederaRecipientEvmAddressVerificationRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaRecipientEvmAddressVerificationRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaRedundantStakingNodeIdError extends Error {
  override name = "HederaRedundantStakingNodeIdError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaRedundantStakingNodeIdError");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaInvalidStakingNodeIdError extends Error {
  override name = "HederaInvalidStakingNodeIdError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaInvalidStakingNodeIdError");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaNoStakingRewardsError extends Error {
  override name = "HederaNoStakingRewardsError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaNoStakingRewardsError");
    if (fields) Object.assign(this, fields);
  }
}

export class HederaMemoExceededSizeError extends Error {
  override name = "HederaMemoExceededSizeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "HederaMemoExceededSizeError");
    if (fields) Object.assign(this, fields);
  }
}
