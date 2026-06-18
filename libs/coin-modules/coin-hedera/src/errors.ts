export class HederaAddAccountError extends Error {
  override name = "HederaAddAccountError";
  constructor(message = "HederaAddAccountError") {
    super(message);
  }
}
export class HederaRecipientInvalidChecksum extends Error {
  override name = "HederaRecipientInvalidChecksum";
  constructor(message = "HederaRecipientInvalidChecksum") {
    super(message);
  }
}
export class HederaInsufficientFundsForAssociation extends Error {
  override name = "HederaInsufficientFundsForAssociation";
  constructor(message = "HederaInsufficientFundsForAssociation", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class HederaRecipientTokenAssociationRequired extends Error {
  override name = "HederaRecipientTokenAssociationRequired";
  constructor(message = "HederaRecipientTokenAssociationRequired") {
    super(message);
  }
}
export class HederaRecipientTokenAssociationUnverified extends Error {
  override name = "HederaRecipientTokenAssociationUnverified";
  constructor(message = "HederaRecipientTokenAssociationUnverified") {
    super(message);
  }
}
export class HederaRecipientEvmAddressVerificationRequired extends Error {
  override name = "HederaRecipientEvmAddressVerificationRequired";
  constructor(message = "HederaRecipientEvmAddressVerificationRequired") {
    super(message);
  }
}
export class HederaRedundantStakingNodeIdError extends Error {
  override name = "HederaRedundantStakingNodeIdError";
  constructor(message = "HederaRedundantStakingNodeIdError") {
    super(message);
  }
}
export class HederaInvalidStakingNodeIdError extends Error {
  override name = "HederaInvalidStakingNodeIdError";
  constructor(message = "HederaInvalidStakingNodeIdError") {
    super(message);
  }
}
export class HederaNoStakingRewardsError extends Error {
  override name = "HederaNoStakingRewardsError";
  constructor(message = "HederaNoStakingRewardsError") {
    super(message);
  }
}

export class HederaMemoExceededSizeError extends Error {
  override name = "HederaMemoExceededSizeError";
  constructor(message = "HederaMemoExceededSizeError") {
    super(message);
  }
}
