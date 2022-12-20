import { createCustomErrorClass } from "@ledgerhq/errors";
// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs
export const ConnectAppTimeout = createCustomErrorClass("ConnectAppTimeout");
export const ConnectManagerTimeout = createCustomErrorClass(
  "ConnectManagerTimeout"
);
export const GetAppAndVersionUnsupportedFormat = createCustomErrorClass(
  "GetAppAndVersionUnsupportedFormat"
);
export const AccountNeedResync = createCustomErrorClass("AccountNeedResync");

export const LatestFirmwareVersionRequired = createCustomErrorClass(
  "LatestFirmwareVersionRequired"
);

export const FeeEstimationFailed = createCustomErrorClass(
  "FeeEstimationFailed"
);
export const LowerThanMinimumRelayFee = createCustomErrorClass(
  "LowerThanMinimumRelayFee"
);
export const TransactionRefusedOnDevice = createCustomErrorClass(
  "TransactionRefusedOnDevice"
);

export const LanguageInstallRefusedOnDevice = createCustomErrorClass(
  "LanguageInstallRefusedOnDevice"
);

export const ImageLoadRefusedOnDevice = createCustomErrorClass(
  "ImageLoadRefusedOnDevice"
);

export const ImageDoesNotExistOnDevice = createCustomErrorClass(
  "ImageDoesNotExistOnDevice"
);

export const ImageCommitRefusedOnDevice = createCustomErrorClass(
  "ImageCommitRefusedOnDevice"
);

export const LanguageInstallTimeout = createCustomErrorClass(
  "LanguageInstallTimeout"
);

export const DeviceNotOnboarded = createCustomErrorClass("DeviceNotOnboarded");
export const InvalidAddressBecauseAlreadyDelegated = createCustomErrorClass(
  "InvalidAddressBecauseAlreadyDelegated"
);

export const AccountAwaitingSendPendingOperations = createCustomErrorClass(
  "AccountAwaitingSendPendingOperations"
);
export const SourceHasMultiSign = createCustomErrorClass("SourceHasMultiSign");

export const RPCHostRequired = createCustomErrorClass("RPCHostRequired");
export const RPCHostInvalid = createCustomErrorClass("RPCHostInvalid");
export const RPCUserRequired = createCustomErrorClass("RPCUserRequired");
export const RPCPassRequired = createCustomErrorClass("RPCPassRequired");

export const SwapNoAvailableProviders = createCustomErrorClass(
  "SwapNoAvailableProviders"
);
export const NoSuchAppOnProvider = createCustomErrorClass(
  "NoSuchAppOnProvider"
);
export const SwapExchangeRateAmountTooLow = createCustomErrorClass(
  "SwapExchangeRateAmountTooLow"
);
export const SwapExchangeRateAmountTooHigh = createCustomErrorClass(
  "SwapExchangeRateAmountTooHigh"
);

export const SwapCheckKYCStatusFailed = createCustomErrorClass(
  "SwapCheckKYCStatusFailed"
);

export const SwapSubmitKYCFailed = createCustomErrorClass(
  "SwapSubmitKYCFailed"
);

export const SwapGenericAPIError = createCustomErrorClass(
  "SwapGenericAPIError"
);

export const JSONRPCResponseError = createCustomErrorClass(
  "JSONRPCResponseError"
);
export const JSONDecodeError = createCustomErrorClass("JSONDecodeError");
export const NoIPHeaderError = createCustomErrorClass("NoIPHeaderError");
export const CurrencyNotSupportedError = createCustomErrorClass(
  "CurrencyNotSupportedError"
);
export const CurrencyDisabledError = createCustomErrorClass(
  "CurrencyDisabledError"
);
export const CurrencyDisabledAsInputError = createCustomErrorClass(
  "CurrencyDisabledAsInputError"
);
export const CurrencyDisabledAsOutputError = createCustomErrorClass(
  "CurrencyDisabledAsOutputError"
);
export const CurrencyNotSupportedByProviderError = createCustomErrorClass(
  "CurrencyNotSupportedByProviderError"
);
export const TradeMethodNotSupportedError = createCustomErrorClass(
  "TradeMethodNotSupportedError"
);
export const UnexpectedError = createCustomErrorClass("UnexpectedError");
export const NotImplementedError = createCustomErrorClass(
  "NotImplementedError"
);
export const ValidationError = createCustomErrorClass("ValidationError");
export const AccessDeniedError = createCustomErrorClass("AccessDeniedError");

export const CompoundLowerAllowanceOfActiveAccountError =
  createCustomErrorClass("CompoundLowerAllowanceOfActiveAccountError");
export const OutdatedApp = createCustomErrorClass("OutdatedApp");
export const FreshAddressIndexInvalid = createCustomErrorClass(
  "FreshAddressIndexInvalid"
);

export const BluetoothNotSupportedError = createCustomErrorClass(
  "FwUpdateBluetoothNotSupported"
);

export const UnsupportedDerivation = createCustomErrorClass(
  "UnsupportedDerivation"
);

export const EConnResetError = createCustomErrorClass("EConnReset");
