export class ConcordiumMemoTooLong extends Error {
  override name = "ConcordiumMemoTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumMemoTooLong");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumInsufficientFunds extends Error {
  override name = "ConcordiumInsufficientFunds";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumInsufficientFunds");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumTrustedMetadataServiceError extends Error {
  override name = "ConcordiumTrustedMetadataServiceError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumTrustedMetadataServiceError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumSessionExpiredError extends Error {
  override name = "ConcordiumSessionExpiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumSessionExpiredError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumPairingExpiredError extends Error {
  override name = "ConcordiumPairingExpiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumPairingExpiredError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumAddressVerificationFailedError extends Error {
  override name = "ConcordiumAddressVerificationFailedError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumAddressVerificationFailedError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumInvalidMaxFeeError extends Error {
  override name = "ConcordiumInvalidMaxFeeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumInvalidMaxFeeError");
    if (fields) Object.assign(this, fields);
  }
}

export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "SimulationError");
    if (fields) Object.assign(this, fields);
  }
}

// ---------------------------------------------------------------------------
// Protocol-Level Token (PLT) errors
// ---------------------------------------------------------------------------

/**
 * The token's module state has `paused: true`, so every balance-changing
 * operation is suspended (CIS-7 `pause`). List updates are unaffected.
 */
export class ConcordiumTokenPaused extends Error {
  override name = "ConcordiumTokenPaused";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumTokenPaused");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The token enforces an allow list and the sender is not on it.
 */
export class ConcordiumAccountNotAllowed extends Error {
  override name = "ConcordiumAccountNotAllowed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumAccountNotAllowed");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The token enforces a deny list and the sender is on it.
 */
export class ConcordiumAccountDenied extends Error {
  override name = "ConcordiumAccountDenied";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumAccountDenied");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The recipient fails the token's own list rules — absent from an allow list,
 * or present on a deny list. Distinct from the sender-side errors because the
 * user's remedy is to change the recipient, not to get themselves approved.
 */
export class ConcordiumRecipientNotAllowed extends Error {
  override name = "ConcordiumRecipientNotAllowed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumRecipientNotAllowed");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The token balance covers the amount but the CCD balance does not cover the
 * fee.
 *
 * Deliberately distinct from {@link ConcordiumInsufficientFunds}: the failing
 * balance is the parent account's, not the token sub-account's, so the remedy
 * is to top up CCD rather than to send less of the token.
 */
export class ConcordiumInsufficientCcdForFee extends Error {
  override name = "ConcordiumInsufficientCcdForFee";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumInsufficientCcdForFee");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The signed `token_id` does not exist on chain. Chain-level, so it is reported
 * against the whole transaction rather than one operation.
 */
export class ConcordiumNonExistentTokenId extends Error {
  override name = "ConcordiumNonExistentTokenId";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumNonExistentTokenId");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The recipient account could not be resolved on chain (`addressNotFound`).
 */
export class ConcordiumRecipientNotFound extends Error {
  override name = "ConcordiumRecipientNotFound";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumRecipientNotFound");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The token module rejected the transfer for a reason that cannot be narrowed
 * further.
 *
 * The catch-all for the broadcast mapping. It covers unrecognised module reject
 * types and, unavoidably, `operationNotPermitted` — see
 * {@link mapPltRejectReason} for why that one cannot be discriminated.
 */
export class ConcordiumPltTransferRejected extends Error {
  override name = "ConcordiumPltTransferRejected";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumPltTransferRejected");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The device refused the PLT payload the wallet built, or the signer refused it
 * before sending. The user did nothing wrong, so this is reported as a defect
 * rather than as a rejected transaction.
 */
export class ConcordiumInvalidPltPayloadError extends Error {
  override name = "ConcordiumInvalidPltPayloadError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumInvalidPltPayloadError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The signer and the device app disagree on the APDU contract: wrong P1/P2,
 * unexpected state, malformed parameter or derivation path, or a device-side
 * buffer or crypto failure.
 */
export class ConcordiumSignerProtocolError extends Error {
  override name = "ConcordiumSignerProtocolError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumSignerProtocolError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The installed Concordium app predates PLT support. Kept distinct from the
 * other signer errors so the send flow can offer an app update instead of
 * reporting a signing failure.
 */
export class ConcordiumAppOutdatedError extends Error {
  override name = "ConcordiumAppOutdatedError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumAppOutdatedError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The sender may not transfer this token, and the stored state cannot say which
 * rule refused them.
 *
 * Deliberately not {@link ConcordiumAccountNotAllowed} or
 * {@link ConcordiumAccountDenied}: `getAccountListStatus` folds "absent from an
 * allow list" and "present on a deny list" into one verdict, and only that
 * verdict is persisted, so naming either cause would assert something unproven.
 */
export class ConcordiumTokenTransferNotPermitted extends Error {
  override name = "ConcordiumTokenTransferNotPermitted";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumTokenTransferNotPermitted");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The token's restrictions could not be read, so nothing can be concluded about
 * whether the sender may transfer it.
 *
 * Distinct from {@link ConcordiumTokenTransferNotPermitted}: the policy did not
 * refuse the account, it failed to decode. Telling a permitted user they are
 * denied is its own defect.
 */
export class ConcordiumTokenRestrictionsUnverified extends Error {
  override name = "ConcordiumTokenRestrictionsUnverified";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumTokenRestrictionsUnverified");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The token declares more decimals than the device can sign.
 *
 * Such a token syncs and shows a balance and can never be sent, so this is
 * reported in status rather than left to the device. See `PLT_MAX_DECIMALS`.
 */
export class ConcordiumUnsupportedTokenDecimals extends Error {
  override name = "ConcordiumUnsupportedTokenDecimals";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumUnsupportedTokenDecimals");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The transaction names a token sub-account the account no longer has.
 *
 * `subAccountId` survives a raw round-trip independently of the sub-account it
 * names, so a draft outlives its token: sync can drop one when it is delisted
 * or blacklisted, and the `enableTokens` kill switch strips them all. Every
 * layer classifies a transfer by resolving that id, so an unresolved one would
 * otherwise reclassify the send as native and move CCD at the token's amount.
 */
export class ConcordiumTokenAccountUnavailable extends Error {
  override name = "ConcordiumTokenAccountUnavailable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumTokenAccountUnavailable");
    if (fields) Object.assign(this, fields);
  }
}
