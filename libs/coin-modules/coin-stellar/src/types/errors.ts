/** Decoded summary of `extras.result_xdr` (Horizon transaction result XDR). */
export type StellarDecodedResultXdr =
  | {
      feeChargedStroops: string;
      resultSwitch: string;
    }
  | {
      decodeFailed: true;
      rawResultXdrBase64: string;
    };

export type StellarBroadcastFailedFields = {
  documentationSummary: string;
  horizonTransactionCode: string;
  horizonOperationCodes: string[] | undefined;
  resultXdrSwitchName: string | undefined;
  feeChargedStroops: string | undefined;
  stellarDocUrl: string;
  decodedResultXdr: StellarDecodedResultXdr | undefined;
  envelopeXdr: string;
};

export class StellarBroadcastFailedError extends Error {
  override name = "StellarBroadcastFailedError";
  cause?: unknown;
  declare documentationSummary: string;
  declare horizonTransactionCode: string;
  declare horizonOperationCodes: string[] | undefined;
  declare resultXdrSwitchName: string | undefined;
  declare feeChargedStroops: string | undefined;
  declare stellarDocUrl: string;
  declare decodedResultXdr: StellarDecodedResultXdr | undefined;
  declare envelopeXdr: string;
  constructor(
    message?: string,
    fields?: StellarBroadcastFailedFields,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (fields) Object.assign(this, fields);
    if (options && "cause" in options) this.cause = options.cause;
  }
}

export class StellarBurnAddressError extends Error {
  override name = "StellarBurnAddressError";
  constructor(message = "StellarBurnAddressError") {
    super(message);
  }
}
export class StellarAssetRequired extends Error {
  override name = "StellarAssetRequired";
  constructor(message = "StellarAssetRequired") {
    super(message);
  }
}
export class StellarMuxedAccountNotExist extends Error {
  override name = "StellarMuxedAccountNotExist";
  constructor(message = "StellarMuxedAccountNotExist") {
    super(message);
  }
}
export class StellarWrongMemoFormat extends Error {
  override name = "StellarWrongMemoFormat";
  constructor(message = "StellarWrongMemoFormat") {
    super(message);
  }
}
export class StellarAssetNotAccepted extends Error {
  override name = "StellarAssetNotAccepted";
  declare assetCode?: string;
  constructor(message = "StellarAssetNotAccepted", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class StellarAssetNotFound extends Error {
  override name = "StellarAssetNotFound";
  constructor(message = "StellarAssetNotFound") {
    super(message);
  }
}
export class StellarNotEnoughNativeBalance extends Error {
  override name = "StellarNotEnoughNativeBalance";
  constructor(message = "StellarNotEnoughNativeBalance") {
    super(message);
  }
}
export class StellarFeeSmallerThanRecommended extends Error {
  override name = "StellarFeeSmallerThanRecommended";
  constructor(message = "StellarFeeSmallerThanRecommended") {
    super(message);
  }
}
export class StellarFeeSmallerThanBase extends Error {
  override name = "StellarFeeSmallerThanBase";
  constructor(message = "StellarFeeSmallerThanBase") {
    super(message);
  }
}
export class StellarNotEnoughNativeBalanceToAddTrustline extends Error {
  override name = "StellarNotEnoughNativeBalanceToAddTrustline";
  constructor(message = "StellarNotEnoughNativeBalanceToAddTrustline") {
    super(message);
  }
}
export class StellarSourceHasMultiSign extends Error {
  override name = "StellarSourceHasMultiSign";
  declare currencyName?: string;
  constructor(message = "StellarSourceHasMultiSign", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
