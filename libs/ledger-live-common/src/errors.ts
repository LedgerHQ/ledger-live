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

export const LanguageInstallTimeout = createCustomErrorClass(
  "LanguageInstallTimeout"
);

export const DeviceNotOnboarded = createCustomErrorClass("DeviceNotOnboarded");
export const InvalidAddressBecauseAlreadyDelegated = createCustomErrorClass(
  "InvalidAddressBecauseAlreadyDelegated"
);
export const TronNoFrozenForBandwidth = createCustomErrorClass(
  "TronNoFrozenForBandwidth"
);
export const TronNoFrozenForEnergy = createCustomErrorClass(
  "TronNoFrozenForEnergy"
);
export const TronUnfreezeNotExpired = createCustomErrorClass(
  "TronUnfreezeNotExpired"
);
export const TronVoteRequired = createCustomErrorClass("TronVoteRequired");
export const TronInvalidVoteCount = createCustomErrorClass(
  "TronInvalidVoteCount"
);
export const TronRewardNotAvailable = createCustomErrorClass(
  "TronRewardNotAvailable"
);
export const TronNoReward = createCustomErrorClass("TronNoReward");
export const TronInvalidFreezeAmount = createCustomErrorClass(
  "TronInvalidFreezeAmount"
);
export const TronSendTrc20ToNewAccountForbidden = createCustomErrorClass(
  "TronSendTrc20ToNewAccountForbidden"
);
export const TronUnexpectedFees = createCustomErrorClass("TronUnexpectedFees");
export const TronNotEnoughTronPower = createCustomErrorClass(
  "TronNotEnoughTronPower"
);
export const TronTransactionExpired = createCustomErrorClass(
  "TronTransactionExpired"
);
export const TronNotEnoughEnergy = createCustomErrorClass(
  "TronNotEnoughEnergy"
);
export const StellarMemoRecommended = createCustomErrorClass(
  "StellarMemoRecommended"
);
export const StellarWrongMemoFormat = createCustomErrorClass(
  "StellarWrongMemoFormat"
);
export const AccountAwaitingSendPendingOperations = createCustomErrorClass(
  "AccountAwaitingSendPendingOperations"
);
export const SourceHasMultiSign = createCustomErrorClass("SourceHasMultiSign");
export const CosmosRedelegationInProgress = createCustomErrorClass(
  "CosmosRedelegationInProgress"
);
export const ClaimRewardsFeesWarning = createCustomErrorClass(
  "ClaimRewardsFeesWarning"
);
export const CosmosDelegateAllFundsWarning = createCustomErrorClass(
  "CosmosDelegateAllFundsWarning"
);
export const CosmosTooManyValidators = createCustomErrorClass(
  "CosmosTooManyValidators"
);
export const NotEnoughDelegationBalance = createCustomErrorClass(
  "NotEnoughDelegationBalance"
);
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
export const SatStackVersionTooOld = createCustomErrorClass(
  "SatStackVersionTooOld"
);
export const SatStackAccessDown = createCustomErrorClass("SatStackAccessDown");
export const SatStackStillSyncing = createCustomErrorClass(
  "SatStackStillSyncing"
);
export const SatStackDescriptorNotImported = createCustomErrorClass(
  "SatStackDescriptorNotImported"
);
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

export const AlgorandASANotOptInInRecipient = createCustomErrorClass(
  "AlgorandASANotOptInInRecipient"
);
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

export * from "./families/polkadot/errors";
export * from "./families/solana/errors";
export * from "./families/cardano/errors";
