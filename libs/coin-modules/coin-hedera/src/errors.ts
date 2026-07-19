export class HederaAddAccountError extends Error {
  override name = "HederaAddAccountError";
}

export class HederaRecipientInvalidChecksum extends Error {
  override name = "HederaRecipientInvalidChecksum";
}

export class HederaInsufficientFundsForAssociation extends Error {
  override name = "HederaInsufficientFundsForAssociation";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class HederaRecipientTokenAssociationRequired extends Error {
  override name = "HederaRecipientTokenAssociationRequired";
}

export class HederaRecipientTokenAssociationUnverified extends Error {
  override name = "HederaRecipientTokenAssociationUnverified";
}

export class HederaRecipientEvmAddressVerificationRequired extends Error {
  override name = "HederaRecipientEvmAddressVerificationRequired";
}

export class HederaRedundantStakingNodeIdError extends Error {
  override name = "HederaRedundantStakingNodeIdError";
}

export class HederaInvalidStakingNodeIdError extends Error {
  override name = "HederaInvalidStakingNodeIdError";
}

export class HederaNoStakingRewardsError extends Error {
  override name = "HederaNoStakingRewardsError";
}

export class HederaMemoExceededSizeError extends Error {
  override name = "HederaMemoExceededSizeError";
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
