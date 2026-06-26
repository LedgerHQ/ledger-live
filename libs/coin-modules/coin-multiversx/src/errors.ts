import { createCustomErrorClass } from "@ledgerhq/errors";

export const MultiversXDecimalsLimitReached = createCustomErrorClass(
  "MultiversXDecimalsLimitReached",
);

export const MultiversXMinDelegatedAmountError = createCustomErrorClass(
  "MultiversXMinDelegatedAmountError",
);

export const MultiversXMinUndelegatedAmountError = createCustomErrorClass(
  "MultiversXMinUndelegatedAmountError",
);

export const MultiversXDelegationBelowMinimumError = createCustomErrorClass(
  "MultiversXDelegationBelowMinimumError",
);

export const NotEnoughEGLDForFees = createCustomErrorClass("NotEnoughEGLDForFees");

// Keep error.name stable: it's used as a cross-boundary identifier.

/** A transfer intent references an asset type MultiversX cannot send (not native EGLD or ESDT). */
export class MultiversXUnsupportedAssetType extends Error {
  override name = "MultiversXUnsupportedAssetType";
  constructor(assetType?: string) {
    super(assetType ? `Unsupported asset type "${assetType}"` : "Unsupported asset type");
  }
}

/** An ESDT transfer intent is missing its token identifier (assetReference). */
export class MultiversXTokenIdentifierRequired extends Error {
  override name = "MultiversXTokenIdentifierRequired";
  constructor() {
    super("tokenIdentifier is required for ESDT transfers");
  }
}

/** A staking intent references an operation MultiversX does not support. */
export class MultiversXUnsupportedStakingType extends Error {
  override name = "MultiversXUnsupportedStakingType";
  constructor(stakingType?: string) {
    super(stakingType ? `Unsupported staking type "${stakingType}"` : "Unsupported staking type");
  }
}

/** A staking intent's recipient is not a delegation/validator contract (erd1qqqq...). */
export class MultiversXStakingRecipientNotValidator extends Error {
  override name = "MultiversXStakingRecipientNotValidator";
  constructor() {
    super("Staking recipient must be a validator contract address (erd1qqqq...)");
  }
}
