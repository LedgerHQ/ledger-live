export class ConnectAppTimeout extends Error {
  override name = "ConnectAppTimeout";
  constructor(message?: string) {
    super(message || "ConnectAppTimeout");
  }
}

export class ConnectManagerTimeout extends Error {
  override name = "ConnectManagerTimeout";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ConnectManagerTimeout");
    if (fields) Object.assign(this, fields);
  }
}

export class GetAppAndVersionUnsupportedFormat extends Error {
  override name = "GetAppAndVersionUnsupportedFormat";
  constructor(message?: string) {
    super(message || "GetAppAndVersionUnsupportedFormat");
  }
}

export class FeeEstimationFailed extends Error {
  override name = "FeeEstimationFailed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FeeEstimationFailed");
    if (fields) Object.assign(this, fields);
  }
}

export class TransactionRefusedOnDevice extends Error {
  override name = "TransactionRefusedOnDevice";
  constructor(message?: string) {
    super(message || "TransactionRefusedOnDevice");
  }
}

export class LanguageInstallRefusedOnDevice extends Error {
  override name = "LanguageInstallRefusedOnDevice";
  constructor(message?: string) {
    super(message || "LanguageInstallRefusedOnDevice");
  }
}

export class ImageLoadRefusedOnDevice extends Error {
  override name = "ImageLoadRefusedOnDevice";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ImageLoadRefusedOnDevice");
    if (fields) Object.assign(this, fields);
  }
}

export class ImageDoesNotExistOnDevice extends Error {
  override name = "ImageDoesNotExistOnDevice";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ImageDoesNotExistOnDevice");
    if (fields) Object.assign(this, fields);
  }
}

export class ImageCommitRefusedOnDevice extends Error {
  override name = "ImageCommitRefusedOnDevice";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ImageCommitRefusedOnDevice");
    if (fields) Object.assign(this, fields);
  }
}

export class LanguageInstallTimeout extends Error {
  override name = "LanguageInstallTimeout";
  constructor(message?: string) {
    super(message || "LanguageInstallTimeout");
  }
}

export class DeviceOnboarded extends Error {
  override name = "DeviceOnboarded";
  constructor(message?: string) {
    super(message || "DeviceOnboarded");
  }
}

export class DeviceNotOnboarded extends Error {
  override name = "DeviceNotOnboarded";
  constructor(message?: string) {
    super(message || "DeviceNotOnboarded");
  }
}

export class DeviceAlreadySetup extends Error {
  override name = "DeviceAlreadySetup";
  device?: string;
  constructor(message?: string, options?: ErrorOptions & { device?: string }) {
    const { device, ...rest } = options ?? {};
    super(message || "DeviceAlreadySetup", rest);
    this.device = device;
  }
}

export class SourceHasMultiSign extends Error {
  override name = "SourceHasMultiSign";
  constructor(message?: string) {
    super(message || "SourceHasMultiSign");
  }
}

// Note: info of this code can be found here:
// https://github.com/cosmos/cosmos-sdk/blob/v0.40.0-rc3/types/errors/errors.go#L16
class CosmosBroadcastCodeInternal extends Error {
  override name = "CosmosBroadcastCodeInternal";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInternal");
  }
}
class CosmosBroadcastCodeTxDecode extends Error {
  override name = "CosmosBroadcastCodeTxDecode";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeTxDecode");
  }
}
class CosmosBroadcastCodeInvalidSequence extends Error {
  override name = "CosmosBroadcastCodeInvalidSequence";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInvalidSequence");
  }
}
class CosmosBroadcastCodeUnauthorized extends Error {
  override name = "CosmosBroadcastCodeUnauthorized";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeUnauthorized");
  }
}
class CosmosBroadcastCodeInsufficientFunds extends Error {
  override name = "CosmosBroadcastCodeInsufficientFunds";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInsufficientFunds");
  }
}
class CosmosBroadcastCodeUnknownRequest extends Error {
  override name = "CosmosBroadcastCodeUnknownRequest";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeUnknownRequest");
  }
}
class CosmosBroadcastCodeInvalidAddress extends Error {
  override name = "CosmosBroadcastCodeInvalidAddress";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInvalidAddress");
  }
}
class CosmosBroadcastCodeInvalidPubKey extends Error {
  override name = "CosmosBroadcastCodeInvalidPubKey";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInvalidPubKey");
  }
}
class CosmosBroadcastCodeUnknownAddress extends Error {
  override name = "CosmosBroadcastCodeUnknownAddress";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeUnknownAddress");
  }
}
class CosmosBroadcastCodeInvalidCoins extends Error {
  override name = "CosmosBroadcastCodeInvalidCoins";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInvalidCoins");
  }
}
class CosmosBroadcastCodeOutOfGas extends Error {
  override name = "CosmosBroadcastCodeOutOfGas";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeOutOfGas");
  }
}
class CosmosBroadcastCodeMemoTooLarge extends Error {
  override name = "CosmosBroadcastCodeMemoTooLarge";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeMemoTooLarge");
  }
}
class CosmosBroadcastCodeInsufficientFee extends Error {
  override name = "CosmosBroadcastCodeInsufficientFee";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInsufficientFee");
  }
}
class CosmosBroadcastCodeTooManySignatures extends Error {
  override name = "CosmosBroadcastCodeTooManySignatures";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeTooManySignatures");
  }
}
class CosmosBroadcastCodeNoSignatures extends Error {
  override name = "CosmosBroadcastCodeNoSignatures";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeNoSignatures");
  }
}
class CosmosBroadcastCodeJSONMarshal extends Error {
  override name = "CosmosBroadcastCodeJSONMarshal";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeJSONMarshal");
  }
}
class CosmosBroadcastCodeJSONUnmarshal extends Error {
  override name = "CosmosBroadcastCodeJSONUnmarshal";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeJSONUnmarshal");
  }
}
class CosmosBroadcastCodeInvalidRequest extends Error {
  override name = "CosmosBroadcastCodeInvalidRequest";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeInvalidRequest");
  }
}
class CosmosBroadcastCodeTxInMempoolCache extends Error {
  override name = "CosmosBroadcastCodeTxInMempoolCache";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeTxInMempoolCache");
  }
}
class CosmosBroadcastCodeMempoolIsFull extends Error {
  override name = "CosmosBroadcastCodeMempoolIsFull";
  constructor(message?: string) {
    super(message || "CosmosBroadcastCodeMempoolIsFull");
  }
}
class CosmosBroadcastTxTooLarge extends Error {
  override name = "CosmosBroadcastTxTooLarge";
  constructor(message?: string) {
    super(message || "CosmosBroadcastTxTooLarge");
  }
}
class CosmosBroadcastKeyNotFound extends Error {
  override name = "CosmosBroadcastKeyNotFound";
  constructor(message?: string) {
    super(message || "CosmosBroadcastKeyNotFound");
  }
}
class CosmosBroadcastWrongPassword extends Error {
  override name = "CosmosBroadcastWrongPassword";
  constructor(message?: string) {
    super(message || "CosmosBroadcastWrongPassword");
  }
}
class CosmosBroadcastInvalidSigner extends Error {
  override name = "CosmosBroadcastInvalidSigner";
  constructor(message?: string) {
    super(message || "CosmosBroadcastInvalidSigner");
  }
}
class CosmosBroadcastInvalidGasAdjustment extends Error {
  override name = "CosmosBroadcastInvalidGasAdjustment";
  constructor(message?: string) {
    super(message || "CosmosBroadcastInvalidGasAdjustment");
  }
}
class CosmosBroadcastInvalidHeight extends Error {
  override name = "CosmosBroadcastInvalidHeight";
  constructor(message?: string) {
    super(message || "CosmosBroadcastInvalidHeight");
  }
}
class CosmosBroadcastInvalidVersion extends Error {
  override name = "CosmosBroadcastInvalidVersion";
  constructor(message?: string) {
    super(message || "CosmosBroadcastInvalidVersion");
  }
}
class CosmosBroadcastInvalidChainID extends Error {
  override name = "CosmosBroadcastInvalidChainID";
  constructor(message?: string) {
    super(message || "CosmosBroadcastInvalidChainID");
  }
}
class CosmosBroadcastInvalidType extends Error {
  override name = "CosmosBroadcastInvalidType";
  constructor(message?: string) {
    super(message || "CosmosBroadcastInvalidType");
  }
}
class CosmosBroadcastTimeoutHeight extends Error {
  override name = "CosmosBroadcastTimeoutHeight";
  constructor(message?: string) {
    super(message || "CosmosBroadcastTimeoutHeight");
  }
}
class CosmosBroadcastUnknownExtensionOptions extends Error {
  override name = "CosmosBroadcastUnknownExtensionOptions";
  constructor(message?: string) {
    super(message || "CosmosBroadcastUnknownExtensionOptions");
  }
}
class CosmosBroadcastWrongSequence extends Error {
  override name = "CosmosBroadcastWrongSequence";
  constructor(message?: string) {
    super(message || "CosmosBroadcastWrongSequence");
  }
}
class CosmosBroadcastPackAny extends Error {
  override name = "CosmosBroadcastPackAny";
  constructor(message?: string) {
    super(message || "CosmosBroadcastPackAny");
  }
}
class CosmosBroadcastUnpackAny extends Error {
  override name = "CosmosBroadcastUnpackAny";
  constructor(message?: string) {
    super(message || "CosmosBroadcastUnpackAny");
  }
}
class CosmosBroadcastLogic extends Error {
  override name = "CosmosBroadcastLogic";
  constructor(message?: string) {
    super(message || "CosmosBroadcastLogic");
  }
}
class CosmosBroadcastConflict extends Error {
  override name = "CosmosBroadcastConflict";
  constructor(message?: string) {
    super(message || "CosmosBroadcastConflict");
  }
}

export const CosmosBroadcastError: Record<string, new (message?: string) => Error> = {
  "1": CosmosBroadcastCodeInternal,
  "2": CosmosBroadcastCodeTxDecode,
  "3": CosmosBroadcastCodeInvalidSequence,
  "4": CosmosBroadcastCodeUnauthorized,
  "5": CosmosBroadcastCodeInsufficientFunds,
  "6": CosmosBroadcastCodeUnknownRequest,
  "7": CosmosBroadcastCodeInvalidAddress,
  "8": CosmosBroadcastCodeInvalidPubKey,
  "9": CosmosBroadcastCodeUnknownAddress,
  "10": CosmosBroadcastCodeInvalidCoins,
  "11": CosmosBroadcastCodeOutOfGas,
  "12": CosmosBroadcastCodeMemoTooLarge,
  "13": CosmosBroadcastCodeInsufficientFee,
  "14": CosmosBroadcastCodeTooManySignatures,
  "15": CosmosBroadcastCodeNoSignatures,
  "16": CosmosBroadcastCodeJSONMarshal,
  "17": CosmosBroadcastCodeJSONUnmarshal,
  "18": CosmosBroadcastCodeInvalidRequest,
  "19": CosmosBroadcastCodeTxInMempoolCache,
  "20": CosmosBroadcastCodeMempoolIsFull,
  "21": CosmosBroadcastTxTooLarge,
  "22": CosmosBroadcastKeyNotFound,
  "23": CosmosBroadcastWrongPassword,
  "24": CosmosBroadcastInvalidSigner,
  "25": CosmosBroadcastInvalidGasAdjustment,
  "26": CosmosBroadcastInvalidHeight,
  "27": CosmosBroadcastInvalidVersion,
  "28": CosmosBroadcastInvalidChainID,
  "29": CosmosBroadcastInvalidType,
  "30": CosmosBroadcastTimeoutHeight,
  "31": CosmosBroadcastUnknownExtensionOptions,
  "32": CosmosBroadcastWrongSequence,
  "33": CosmosBroadcastPackAny,
  "34": CosmosBroadcastUnpackAny,
  "35": CosmosBroadcastLogic,
  "36": CosmosBroadcastConflict,
};

export class SwapNoAvailableProviders extends Error {
  override name = "SwapNoAvailableProviders";
  constructor(message?: string) {
    super(message || "SwapNoAvailableProviders");
  }
}

export class NoSuchAppOnProvider extends Error {
  override name = "NoSuchAppOnProvider";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NoSuchAppOnProvider");
    if (fields) Object.assign(this, fields);
  }
}

export class SwapExchangeRateAmountTooLow extends Error {
  override name = "SwapExchangeRateAmountTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SwapExchangeRateAmountTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class SwapExchangeRateAmountTooHigh extends Error {
  override name = "SwapExchangeRateAmountTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SwapExchangeRateAmountTooHigh");
    if (fields) Object.assign(this, fields);
  }
}

export class SwapExchangeRateAmountTooLowOrTooHigh extends Error {
  override name = "SwapExchangeRateAmountTooLowOrTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SwapExchangeRateAmountTooLowOrTooHigh");
    if (fields) Object.assign(this, fields);
  }
}

export class SwapGenericAPIError extends Error {
  override name = "SwapGenericAPIError";
  constructor(message?: string) {
    super(message || "SwapGenericAPIError");
  }
}

export class SwapRateExpiredError extends Error {
  override name = "SwapRateExpiredError";
  constructor(message?: string) {
    super(message || "SwapRateExpiredError");
  }
}

export class JSONRPCResponseError extends Error {
  override name = "JSONRPCResponseError";
  constructor(message?: string) {
    super(message || "JSONRPCResponseError");
  }
}

export class JSONDecodeError extends Error {
  override name = "JSONDecodeError";
  constructor(message?: string) {
    super(message || "JSONDecodeError");
  }
}

export class NoIPHeaderError extends Error {
  override name = "NoIPHeaderError";
  constructor(message?: string) {
    super(message || "NoIPHeaderError");
  }
}

export class CurrencyNotSupportedError extends Error {
  override name = "CurrencyNotSupportedError";
  constructor(message?: string) {
    super(message || "CurrencyNotSupportedError");
  }
}

export class CurrencyDisabledError extends Error {
  override name = "CurrencyDisabledError";
  constructor(message?: string) {
    super(message || "CurrencyDisabledError");
  }
}

export class CurrencyDisabledAsInputError extends Error {
  override name = "CurrencyDisabledAsInputError";
  constructor(message?: string) {
    super(message || "CurrencyDisabledAsInputError");
  }
}

export class CurrencyDisabledAsOutputError extends Error {
  override name = "CurrencyDisabledAsOutputError";
  constructor(message?: string) {
    super(message || "CurrencyDisabledAsOutputError");
  }
}

export class CurrencyNotSupportedByProviderError extends Error {
  override name = "CurrencyNotSupportedByProviderError";
  constructor(message?: string) {
    super(message || "CurrencyNotSupportedByProviderError");
  }
}

export class TradeMethodNotSupportedError extends Error {
  override name = "TradeMethodNotSupportedError";
  constructor(message?: string) {
    super(message || "TradeMethodNotSupportedError");
  }
}

export class UnexpectedError extends Error {
  override name = "UnexpectedError";
  constructor(message?: string) {
    super(message || "UnexpectedError");
  }
}

export class NotImplementedError extends Error {
  override name = "NotImplementedError";
  constructor(message?: string) {
    super(message || "NotImplementedError");
  }
}

// Thrown by account.getPublicKey when no usable public key is available for the account. The
// class name is a stable identifier consumers match on across the wallet-api transport (e.g.
// WalletConnect).
export class AccountPublicKeyUnavailable extends Error {
  override name = "AccountPublicKeyUnavailable";
  constructor(message?: string) {
    super(message || "AccountPublicKeyUnavailable");
  }
}

export class ValidationError extends Error {
  override name = "ValidationError";
  constructor(message?: string) {
    super(message || "ValidationError");
  }
}

export class AccessDeniedError extends Error {
  override name = "AccessDeniedError";
  constructor(message?: string) {
    super(message || "AccessDeniedError");
  }
}

export class OutdatedApp extends Error {
  override name = "OutdatedApp";
  constructor(message?: string) {
    super(message || "OutdatedApp");
  }
}

export class BluetoothNotSupportedError extends Error {
  override name = "FwUpdateBluetoothNotSupported";
  constructor(message?: string) {
    super(message || "BluetoothNotSupportedError");
  }
}

export class EConnResetError extends Error {
  override name = "EConnReset";
  constructor(message?: string) {
    super(message || "EConnResetError");
  }
}

export class PasswordsDontMatchError extends Error {
  override name = "PasswordsDontMatch";
  constructor(message?: string) {
    super(message || "PasswordsDontMatchError");
  }
}

export class PasswordIncorrectError extends Error {
  override name = "PasswordIncorrect";
  constructor(message?: string) {
    super(message || "PasswordIncorrectError");
  }
}

export class NotSupportedLegacyAddress extends Error {
  override name = "NotSupportedLegacyAddress";
  constructor(message?: string) {
    super(message || "NotSupportedLegacyAddress");
  }
}

export class DeviceOnDashboardExpected extends Error {
  override name = "DeviceOnDashboardExpected";
  constructor(message?: string) {
    super(message || "DeviceOnDashboardExpected");
  }
}

export class DeviceOnDashboardUnexpected extends Error {
  override name = "DeviceOnDashboardUnexpected";
  constructor(message?: string) {
    super(message || "DeviceOnDashboardUnexpected");
  }
}

export class DeviceInOSUExpected extends Error {
  override name = "DeviceInOSUExpected";
  constructor(message?: string) {
    super(message || "DeviceInOSUExpected");
  }
}

export class DeviceHalted extends Error {
  override name = "DeviceHalted";
  constructor(message?: string) {
    super(message || "DeviceHalted");
  }
}

export class DeviceSocketFail extends Error {
  override name = "DeviceSocketFail";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DeviceSocketFail");
    if (fields) Object.assign(this, fields);
  }
}

export class DeviceOnboardingStatePollingError extends Error {
  override name = "DeviceOnboardingStatePollingError";
  constructor(message?: string) {
    super(message || "DeviceOnboardingStatePollingError");
  }
}

export class DeviceExtractOnboardingStateError extends Error {
  override name = "DeviceExtractOnboardingStateError";
  constructor(message?: string) {
    super(message || "DeviceExtractOnboardingStateError");
  }
}

export class DeviceAppVerifyNotSupported extends Error {
  override name = "DeviceAppVerifyNotSupported";
  constructor(message?: string) {
    super(message || "DeviceAppVerifyNotSupported");
  }
}

export class UnresponsiveDeviceError extends Error {
  override name = "UnresponsiveDeviceError";
  constructor(message?: string) {
    super(message || "UnresponsiveDeviceError");
  }
}

export class WebsocketConnectionError extends Error {
  override name = "WebsocketConnectionError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "WebsocketConnectionError");
    if (fields) Object.assign(this, fields);
  }
}

export class ManagerAppAlreadyInstalledError extends Error {
  override name = "ManagerAppAlreadyInstalled";
  constructor(message?: string) {
    super(message || "ManagerAppAlreadyInstalledError");
  }
}

export class ManagerAppRelyOnBTCError extends Error {
  override name = "ManagerAppRelyOnBTC";
  constructor(message?: string) {
    super(message || "ManagerAppRelyOnBTCError");
  }
}

export class ManagerAppDepInstallRequired extends Error {
  override name = "ManagerAppDepInstallRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ManagerAppDepInstallRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class ManagerAppDepUninstallRequired extends Error {
  override name = "ManagerAppDepUninstallRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ManagerAppDepUninstallRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class ManagerDeviceLockedError extends Error {
  override name = "ManagerDeviceLocked";
  constructor(message?: string) {
    super(message || "ManagerDeviceLockedError");
  }
}

export class ManagerFirmwareNotEnoughSpaceError extends Error {
  override name = "ManagerFirmwareNotEnoughSpace";
  constructor(message?: string) {
    super(message || "ManagerFirmwareNotEnoughSpaceError");
  }
}

export class ManagerNotEnoughSpaceError extends Error {
  override name = "ManagerNotEnoughSpace";
  constructor(message?: string) {
    super(message || "ManagerNotEnoughSpaceError");
  }
}

export class UnsupportedFeatureError extends Error {
  override name = "UnsupportedFeatureError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnsupportedFeatureError");
    if (fields) Object.assign(this, fields);
  }
}

export class LanguageNotFound extends Error {
  override name = "LanguageNotFound";
  constructor(message?: string) {
    super(message || "LanguageNotFound");
  }
}

export class FirmwareNotRecognized extends Error {
  override name = "FirmwareNotRecognized";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FirmwareNotRecognized");
    if (fields) Object.assign(this, fields);
  }
}

export class FirmwareOrAppUpdateRequired extends Error {
  override name = "FirmwareOrAppUpdateRequired";
  constructor(message?: string) {
    super(message || "FirmwareOrAppUpdateRequired");
  }
}

export class LatestFirmwareVersionRequired extends Error {
  override name = "LatestFirmwareVersionRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "LatestFirmwareVersionRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class UnexpectedBootloader extends Error {
  override name = "UnexpectedBootloader";
  constructor(message?: string) {
    super(message || "UnexpectedBootloader");
  }
}

export class MCUNotGenuineToDashboard extends Error {
  override name = "MCUNotGenuineToDashboard";
  constructor(message?: string) {
    super(message || "MCUNotGenuineToDashboard");
  }
}

export class AccountNotSupported extends Error {
  override name = "AccountNotSupported";
  constructor(message?: string) {
    super(message || "AccountNotSupported");
  }
}

export class AccountAwaitingSendPendingOperations extends Error {
  override name = "AccountAwaitingSendPendingOperations";
  constructor(message?: string) {
    super(message || "AccountAwaitingSendPendingOperations");
  }
}

export class NoAddressesFound extends Error {
  override name = "NoAddressesFound";
  constructor(message?: string) {
    super(message || "NoAddressesFound");
  }
}

export class CurrencyNotSupported extends Error {
  override name = "CurrencyNotSupported";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CurrencyNotSupported");
    if (fields) Object.assign(this, fields);
  }
}

export { NetworkDown, LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/live-network/errors";

export class NetworkError extends Error {
  override name = "NetworkError";
  constructor(message?: string) {
    super(message || "NetworkError");
  }
}

export class LedgerAPIError extends Error {
  override name = "LedgerAPIError";
  constructor(message?: string) {
    super(message || "LedgerAPIError");
  }
}

export class LedgerAPIErrorWithMessage extends Error {
  override name = "LedgerAPIErrorWithMessage";
  constructor(message?: string) {
    super(message || "LedgerAPIErrorWithMessage");
  }
}

export class LedgerAPINotAvailable extends Error {
  override name = "LedgerAPINotAvailable";
  constructor(message?: string) {
    super(message || "LedgerAPINotAvailable");
  }
}

export class RecommendSubAccountsToEmpty extends Error {
  override name = "RecommendSubAccountsToEmpty";
  constructor(message?: string) {
    super(message || "RecommendSubAccountsToEmpty");
  }
}

export class RecommendUndelegation extends Error {
  override name = "RecommendUndelegation";
  constructor(message?: string) {
    super(message || "RecommendUndelegation");
  }
}

export class ReplacementTransactionUnderpriced extends Error {
  override name = "ReplacementTransactionUnderpriced";
  constructor(message?: string) {
    super(message || "ReplacementTransactionUnderpriced");
  }
}

export class NotEnoughBalanceSwap extends Error {
  override name = "NotEnoughBalanceSwap";
  constructor(message?: string) {
    super(message || "NotEnoughBalanceSwap");
  }
}

export class NotEnoughGasSwap extends Error {
  override name = "NotEnoughGasSwap";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughGasSwap");
    if (fields) Object.assign(this, fields);
  }
}

export class FeeNotLoadedSwap extends Error {
  override name = "FeeNotLoadedSwap";
  constructor(message?: string) {
    super(message || "FeeNotLoadedSwap");
  }
}

export class MissingSwapPayloadParamaters extends Error {
  override name = "MissingSwapPayloadParamaters";
  constructor(message?: string) {
    super(message || "MissingSwapPayloadParamaters");
  }
}

export class UserRefusedDeviceNameChange extends Error {
  override name = "UserRefusedDeviceNameChange";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UserRefusedDeviceNameChange");
    if (fields) Object.assign(this, fields);
  }
}

export class UserRefusedAddress extends Error {
  override name = "UserRefusedAddress";
  constructor(message?: string) {
    super(message || "UserRefusedAddress");
  }
}

export class UserRefusedFirmwareUpdate extends Error {
  override name = "UserRefusedFirmwareUpdate";
  constructor(message?: string) {
    super(message || "UserRefusedFirmwareUpdate");
  }
}

export class UserRefusedAllowManager extends Error {
  override name = "UserRefusedAllowManager";
  constructor(message?: string) {
    super(message || "UserRefusedAllowManager");
  }
}

export class WrongDeviceForAccountPayout extends Error {
  override name = "WrongDeviceForAccountPayout";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "WrongDeviceForAccountPayout");
    if (fields) Object.assign(this, fields);
  }
}

export class WrongDeviceForAccountRefund extends Error {
  override name = "WrongDeviceForAccountRefund";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "WrongDeviceForAccountRefund");
    if (fields) Object.assign(this, fields);
  }
}

export class PairingFailed extends Error {
  override name = "PairingFailed";
  constructor(message?: string) {
    super(message || "PairingFailed");
  }
}

export class PeerRemovedPairing extends Error {
  override name = "PeerRemovedPairing";
  constructor(message?: string) {
    super(message || "PeerRemovedPairing");
  }
}

export class GenuineCheckFailed extends Error {
  override name = "GenuineCheckFailed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "GenuineCheckFailed");
    if (fields) Object.assign(this, fields);
  }
}

export class DisabledTransactionBroadcastError extends Error {
  override name = "DisabledTransactionBroadcastError";
  constructor(message?: string) {
    super(message || "DisabledTransactionBroadcastError");
  }
}

export class SyncError extends Error {
  override name = "SyncError";
  constructor(message?: string) {
    super(message || "SyncError");
  }
}

export class PendingOperation extends Error {
  override name = "PendingOperation";
  constructor(message?: string) {
    super(message || "PendingOperation");
  }
}

export class TimeoutTagged extends Error {
  override name = "TimeoutTagged";
  constructor(message?: string) {
    super(message || "TimeoutTagged");
  }
}

export class InvalidParameterError extends Error {
  override name = "InvalidParameterError";
  constructor(message?: string) {
    super(message || "InvalidParameterError");
  }
}

export class DeviceNotGenuineError extends Error {
  override name = "DeviceNotGenuine";
  constructor(message?: string) {
    super(message || "DeviceNotGenuineError");
  }
}

export class DeviceGenuineSocketEarlyClose extends Error {
  override name = "DeviceGenuineSocketEarlyClose";
  constructor(message?: string) {
    super(message || "DeviceGenuineSocketEarlyClose");
  }
}

export class UnknownMCU extends Error {
  override name = "UnknownMCU";
  constructor(message?: string) {
    super(message || "UnknownMCU");
  }
}

export class PinNotSet extends Error {
  override name = "PinNotSet";
  constructor(message?: string) {
    super(message || "PinNotSet");
  }
}

export class ExpertModeRequired extends Error {
  override name = "ExpertModeRequired";
  constructor(message?: string) {
    super(message || "ExpertModeRequired");
  }
}

export class DeviceNameInvalid extends Error {
  override name = "DeviceNameInvalid";
  invalidCharacters?: string;

  constructor(message?: string, options?: ErrorOptions & { invalidCharacters?: string }) {
    const { invalidCharacters, ...rest } = options ?? {};
    super(message || "DeviceNameInvalid", rest);
    this.invalidCharacters = invalidCharacters;
  }
}

export class NanoSNotSupported extends Error {
  override name = "NanoSNotSupported";
  constructor(message?: string) {
    super(message || "NanoSNotSupported");
  }
}

export class HardResetFail extends Error {
  override name = "HardResetFail";
  constructor(message?: string) {
    super(message || "HardResetFail");
  }
}

export class LatestMCUInstalledError extends Error {
  override name = "LatestMCUInstalledError";
  constructor(message?: string) {
    super(message || "LatestMCUInstalledError");
  }
}

export class DeviceSocketNoBulkStatus extends Error {
  override name = "DeviceSocketNoBulkStatus";
  constructor(message?: string) {
    super(message || "DeviceSocketNoBulkStatus");
  }
}

export class UpdateYourApp extends Error {
  override name = "UpdateYourApp";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UpdateYourApp");
    if (fields) Object.assign(this, fields);
  }
}

export class NoAccessToCamera extends Error {
  override name = "NoAccessToCamera";
  constructor(message?: string) {
    super(message || "NoAccessToCamera");
  }
}

export class TransactionHasBeenValidatedError extends Error {
  override name = "TransactionHasBeenValidatedError";
  constructor(message?: string) {
    super(message || "TransactionHasBeenValidatedError");
  }
}

export class CantScanQRCode extends Error {
  override name = "CantScanQRCode";
  constructor(message?: string) {
    super(message || "CantScanQRCode");
  }
}

export class WrongAppForCurrency extends Error {
  override name = "WrongAppForCurrency";
  constructor(message?: string) {
    super(message || "WrongAppForCurrency");
  }
}

export class BtcUnmatchedApp extends Error {
  override name = "BtcUnmatchedApp";
  constructor(message?: string) {
    super(message || "BtcUnmatchedApp");
  }
}

export class WebsocketConnectionFailed extends Error {
  override name = "WebsocketConnectionFailed";
  constructor(message?: string) {
    super(message || "WebsocketConnectionFailed");
  }
}

// Explicit re-exports to resolve conflicts where multiple coin packages define the same error name.
// Each class has identical .name values so the choice is transparent at runtime.
export { NotEnoughGas } from "@ledgerhq/coin-evm/errors";
export { ClaimRewardsFeesWarning } from "@ledgerhq/coin-cosmos/errors";
export { ValAddressRequired } from "@ledgerhq/coin-evm/errors";

export * from "@ledgerhq/ledger-wallet-framework/errors";
export * from "@ledgerhq/coin-module-framework/errors";
export * from "@ledgerhq/coin-algorand/errors";
export * from "@ledgerhq/coin-aptos/errors";
export * from "@ledgerhq/coin-bitcoin/errors";
export * from "@ledgerhq/coin-cardano/errors";
export * from "@ledgerhq/coin-cosmos/errors";
export * from "@ledgerhq/coin-evm/errors";
export * from "@ledgerhq/coin-hedera/errors";
export * from "@ledgerhq/coin-celo/errors";
export * from "@ledgerhq/coin-filecoin/errors";
export * from "@ledgerhq/coin-near/errors";
export * from "@ledgerhq/coin-polkadot/errors";
export * from "@ledgerhq/coin-solana/errors";
export * from "@ledgerhq/coin-stacks/errors";
export * from "@ledgerhq/coin-stellar/errors";
export * from "@ledgerhq/coin-tezos/errors";
export * from "@ledgerhq/coin-vechain/errors";
