import { createCustomErrorClass } from "@ledgerhq/errors";
// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs
export const ConnectAppTimeout = createCustomErrorClass("ConnectAppTimeout");
export const ConnectManagerTimeout = createCustomErrorClass("ConnectManagerTimeout");
export const GetAppAndVersionUnsupportedFormat = createCustomErrorClass(
  "GetAppAndVersionUnsupportedFormat",
);

export const LatestFirmwareVersionRequired = createCustomErrorClass(
  "LatestFirmwareVersionRequired",
);

export const FeeEstimationFailed = createCustomErrorClass("FeeEstimationFailed");
export const TransactionRefusedOnDevice = createCustomErrorClass("TransactionRefusedOnDevice");

export const LanguageInstallRefusedOnDevice = createCustomErrorClass(
  "LanguageInstallRefusedOnDevice",
);

export const ImageLoadRefusedOnDevice = createCustomErrorClass("ImageLoadRefusedOnDevice");

export const ImageDoesNotExistOnDevice = createCustomErrorClass("ImageDoesNotExistOnDevice");

export const ImageCommitRefusedOnDevice = createCustomErrorClass("ImageCommitRefusedOnDevice");

export const LanguageInstallTimeout = createCustomErrorClass("LanguageInstallTimeout");

export const DeviceOnboarded = createCustomErrorClass("DeviceOnboarded");
export const DeviceNotOnboarded = createCustomErrorClass("DeviceNotOnboarded");
export const DeviceAlreadySetup = createCustomErrorClass("DeviceAlreadySetup");

export const SourceHasMultiSign = createCustomErrorClass("SourceHasMultiSign");

export const RPCHostRequired = createCustomErrorClass("RPCHostRequired");
export const RPCHostInvalid = createCustomErrorClass("RPCHostInvalid");
export const RPCUserRequired = createCustomErrorClass("RPCUserRequired");
export const RPCPassRequired = createCustomErrorClass("RPCPassRequired");
// Note : info of this code can be found here :
// https://github.com/cosmos/cosmos-sdk/blob/v0.40.0-rc3/types/errors/errors.go#L16
export const CosmosBroadcastError = {
  "1": createCustomErrorClass("CosmosBroadcastCodeInternal"),
  "2": createCustomErrorClass("CosmosBroadcastCodeTxDecode"),
  "3": createCustomErrorClass("CosmosBroadcastCodeInvalidSequence"),
  "4": createCustomErrorClass("CosmosBroadcastCodeUnauthorized"),
  "5": createCustomErrorClass("CosmosBroadcastCodeInsufficientFunds"),
  "6": createCustomErrorClass("CosmosBroadcastCodeUnknownRequest"),
  "7": createCustomErrorClass("CosmosBroadcastCodeInvalidAddress"),
  "8": createCustomErrorClass("CosmosBroadcastCodeInvalidPubKey"),
  "9": createCustomErrorClass("CosmosBroadcastCodeUnknownAddress"),
  "10": createCustomErrorClass("CosmosBroadcastCodeInvalidCoins"),
  "11": createCustomErrorClass("CosmosBroadcastCodeOutOfGas"),
  "12": createCustomErrorClass("CosmosBroadcastCodeMemoTooLarge"),
  "13": createCustomErrorClass("CosmosBroadcastCodeInsufficientFee"),
  "14": createCustomErrorClass("CosmosBroadcastCodeTooManySignatures"),
  "15": createCustomErrorClass("CosmosBroadcastCodeNoSignatures"),
  "16": createCustomErrorClass("CosmosBroadcastCodeJSONMarshal"),
  "17": createCustomErrorClass("CosmosBroadcastCodeJSONUnmarshal"),
  "18": createCustomErrorClass("CosmosBroadcastCodeInvalidRequest"),
  "19": createCustomErrorClass("CosmosBroadcastCodeTxInMempoolCache"),
  "20": createCustomErrorClass("CosmosBroadcastCodeMempoolIsFull"),
  "21": createCustomErrorClass("CosmosBroadcastTxTooLarge"),
  "22": createCustomErrorClass("CosmosBroadcastKeyNotFound"),
  "23": createCustomErrorClass("CosmosBroadcastWrongPassword"),
  "24": createCustomErrorClass("CosmosBroadcastInvalidSigner"),
  "25": createCustomErrorClass("CosmosBroadcastInvalidGasAdjustment"),
  "26": createCustomErrorClass("CosmosBroadcastInvalidHeight"),
  "27": createCustomErrorClass("CosmosBroadcastInvalidVersion"),
  "28": createCustomErrorClass("CosmosBroadcastInvalidChainID"),
  "29": createCustomErrorClass("CosmosBroadcastInvalidType"),
  "30": createCustomErrorClass("CosmosBroadcastTimeoutHeight"),
  "31": createCustomErrorClass("CosmosBroadcastUnknownExtensionOptions"),
  "32": createCustomErrorClass("CosmosBroadcastWrongSequence"),
  "33": createCustomErrorClass("CosmosBroadcastPackAny"),
  "34": createCustomErrorClass("CosmosBroadcastUnpackAny"),
  "35": createCustomErrorClass("CosmosBroadcastLogic"),
  "36": createCustomErrorClass("CosmosBroadcastConflict"),
};
export const SatStackVersionTooOld = createCustomErrorClass("SatStackVersionTooOld");
export const SatStackAccessDown = createCustomErrorClass("SatStackAccessDown");
export const SatStackStillSyncing = createCustomErrorClass("SatStackStillSyncing");
export const SatStackDescriptorNotImported = createCustomErrorClass(
  "SatStackDescriptorNotImported",
);
export const SwapNoAvailableProviders = createCustomErrorClass("SwapNoAvailableProviders");
export const NoSuchAppOnProvider = createCustomErrorClass("NoSuchAppOnProvider");
export const SwapExchangeRateAmountTooLow = createCustomErrorClass("SwapExchangeRateAmountTooLow");
export const SwapExchangeRateAmountTooHigh = createCustomErrorClass(
  "SwapExchangeRateAmountTooHigh",
);
export const SwapExchangeRateAmountTooLowOrTooHigh = createCustomErrorClass(
  "SwapExchangeRateAmountTooLowOrTooHigh",
);

export const SwapGenericAPIError = createCustomErrorClass("SwapGenericAPIError");
export const SwapRateExpiredError = createCustomErrorClass("SwapRateExpiredError");

export const JSONRPCResponseError = createCustomErrorClass("JSONRPCResponseError");
export const JSONDecodeError = createCustomErrorClass("JSONDecodeError");
export const NoIPHeaderError = createCustomErrorClass("NoIPHeaderError");
export const CurrencyNotSupportedError = createCustomErrorClass("CurrencyNotSupportedError");
export const CurrencyDisabledError = createCustomErrorClass("CurrencyDisabledError");
export const CurrencyDisabledAsInputError = createCustomErrorClass("CurrencyDisabledAsInputError");
export const CurrencyDisabledAsOutputError = createCustomErrorClass(
  "CurrencyDisabledAsOutputError",
);
export const CurrencyNotSupportedByProviderError = createCustomErrorClass(
  "CurrencyNotSupportedByProviderError",
);
export const TradeMethodNotSupportedError = createCustomErrorClass("TradeMethodNotSupportedError");
export const UnexpectedError = createCustomErrorClass("UnexpectedError");
export const NotImplementedError = createCustomErrorClass("NotImplementedError");
export const ValidationError = createCustomErrorClass("ValidationError");
export const AccessDeniedError = createCustomErrorClass("AccessDeniedError");

export const OutdatedApp = createCustomErrorClass("OutdatedApp");

export const BluetoothNotSupportedError = createCustomErrorClass("FwUpdateBluetoothNotSupported");

export const EConnResetError = createCustomErrorClass("EConnReset");

export { ClaimRewardsFeesWarning } from "@ledgerhq/errors";
export * from "@ledgerhq/coin-framework/errors";
export * from "@ledgerhq/coin-algorand/errors";
export * from "@ledgerhq/coin-bitcoin/errors";
export * from "@ledgerhq/coin-cardano/errors";
export * from "@ledgerhq/coin-cosmos/errors";
export * from "@ledgerhq/coin-evm/errors";
export * from "@ledgerhq/coin-hedera/errors";
export * from "@ledgerhq/coin-near/errors";
export * from "@ledgerhq/coin-polkadot/errors";
export * from "@ledgerhq/coin-solana/errors";
export * from "@ledgerhq/coin-stellar/errors";
export * from "@ledgerhq/coin-tezos/errors";
