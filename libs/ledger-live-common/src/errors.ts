export class ConnectAppTimeout extends Error {
  override name = "ConnectAppTimeout";
}

export class ConnectManagerTimeout extends Error {
  override name = "ConnectManagerTimeout";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class GetAppAndVersionUnsupportedFormat extends Error {
  override name = "GetAppAndVersionUnsupportedFormat";
}

export class FeeEstimationFailed extends Error {
  override name = "FeeEstimationFailed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class TransactionRefusedOnDevice extends Error {
  override name = "TransactionRefusedOnDevice";
}

export class LanguageInstallRefusedOnDevice extends Error {
  override name = "LanguageInstallRefusedOnDevice";
}

export class ImageLoadRefusedOnDevice extends Error {
  override name = "ImageLoadRefusedOnDevice";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ImageDoesNotExistOnDevice extends Error {
  override name = "ImageDoesNotExistOnDevice";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ImageCommitRefusedOnDevice extends Error {
  override name = "ImageCommitRefusedOnDevice";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class LanguageInstallTimeout extends Error {
  override name = "LanguageInstallTimeout";
}

export class DeviceOnboarded extends Error {
  override name = "DeviceOnboarded";
}

export class DeviceNotOnboarded extends Error {
  override name = "DeviceNotOnboarded";
}

export class DeviceAlreadySetup extends Error {
  override name = "DeviceAlreadySetup";
}

export class SourceHasMultiSign extends Error {
  override name = "SourceHasMultiSign";
}

// Note: info of this code can be found here:
// https://github.com/cosmos/cosmos-sdk/blob/v0.40.0-rc3/types/errors/errors.go#L16
class CosmosBroadcastCodeInternal extends Error {
  override name = "CosmosBroadcastCodeInternal";
}
class CosmosBroadcastCodeTxDecode extends Error {
  override name = "CosmosBroadcastCodeTxDecode";
}
class CosmosBroadcastCodeInvalidSequence extends Error {
  override name = "CosmosBroadcastCodeInvalidSequence";
}
class CosmosBroadcastCodeUnauthorized extends Error {
  override name = "CosmosBroadcastCodeUnauthorized";
}
class CosmosBroadcastCodeInsufficientFunds extends Error {
  override name = "CosmosBroadcastCodeInsufficientFunds";
}
class CosmosBroadcastCodeUnknownRequest extends Error {
  override name = "CosmosBroadcastCodeUnknownRequest";
}
class CosmosBroadcastCodeInvalidAddress extends Error {
  override name = "CosmosBroadcastCodeInvalidAddress";
}
class CosmosBroadcastCodeInvalidPubKey extends Error {
  override name = "CosmosBroadcastCodeInvalidPubKey";
}
class CosmosBroadcastCodeUnknownAddress extends Error {
  override name = "CosmosBroadcastCodeUnknownAddress";
}
class CosmosBroadcastCodeInvalidCoins extends Error {
  override name = "CosmosBroadcastCodeInvalidCoins";
}
class CosmosBroadcastCodeOutOfGas extends Error {
  override name = "CosmosBroadcastCodeOutOfGas";
}
class CosmosBroadcastCodeMemoTooLarge extends Error {
  override name = "CosmosBroadcastCodeMemoTooLarge";
}
class CosmosBroadcastCodeInsufficientFee extends Error {
  override name = "CosmosBroadcastCodeInsufficientFee";
}
class CosmosBroadcastCodeTooManySignatures extends Error {
  override name = "CosmosBroadcastCodeTooManySignatures";
}
class CosmosBroadcastCodeNoSignatures extends Error {
  override name = "CosmosBroadcastCodeNoSignatures";
}
class CosmosBroadcastCodeJSONMarshal extends Error {
  override name = "CosmosBroadcastCodeJSONMarshal";
}
class CosmosBroadcastCodeJSONUnmarshal extends Error {
  override name = "CosmosBroadcastCodeJSONUnmarshal";
}
class CosmosBroadcastCodeInvalidRequest extends Error {
  override name = "CosmosBroadcastCodeInvalidRequest";
}
class CosmosBroadcastCodeTxInMempoolCache extends Error {
  override name = "CosmosBroadcastCodeTxInMempoolCache";
}
class CosmosBroadcastCodeMempoolIsFull extends Error {
  override name = "CosmosBroadcastCodeMempoolIsFull";
}
class CosmosBroadcastTxTooLarge extends Error {
  override name = "CosmosBroadcastTxTooLarge";
}
class CosmosBroadcastKeyNotFound extends Error {
  override name = "CosmosBroadcastKeyNotFound";
}
class CosmosBroadcastWrongPassword extends Error {
  override name = "CosmosBroadcastWrongPassword";
}
class CosmosBroadcastInvalidSigner extends Error {
  override name = "CosmosBroadcastInvalidSigner";
}
class CosmosBroadcastInvalidGasAdjustment extends Error {
  override name = "CosmosBroadcastInvalidGasAdjustment";
}
class CosmosBroadcastInvalidHeight extends Error {
  override name = "CosmosBroadcastInvalidHeight";
}
class CosmosBroadcastInvalidVersion extends Error {
  override name = "CosmosBroadcastInvalidVersion";
}
class CosmosBroadcastInvalidChainID extends Error {
  override name = "CosmosBroadcastInvalidChainID";
}
class CosmosBroadcastInvalidType extends Error {
  override name = "CosmosBroadcastInvalidType";
}
class CosmosBroadcastTimeoutHeight extends Error {
  override name = "CosmosBroadcastTimeoutHeight";
}
class CosmosBroadcastUnknownExtensionOptions extends Error {
  override name = "CosmosBroadcastUnknownExtensionOptions";
}
class CosmosBroadcastWrongSequence extends Error {
  override name = "CosmosBroadcastWrongSequence";
}
class CosmosBroadcastPackAny extends Error {
  override name = "CosmosBroadcastPackAny";
}
class CosmosBroadcastUnpackAny extends Error {
  override name = "CosmosBroadcastUnpackAny";
}
class CosmosBroadcastLogic extends Error {
  override name = "CosmosBroadcastLogic";
}
class CosmosBroadcastConflict extends Error {
  override name = "CosmosBroadcastConflict";
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
}

export class NoSuchAppOnProvider extends Error {
  override name = "NoSuchAppOnProvider";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SwapExchangeRateAmountTooLow extends Error {
  override name = "SwapExchangeRateAmountTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SwapExchangeRateAmountTooHigh extends Error {
  override name = "SwapExchangeRateAmountTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SwapExchangeRateAmountTooLowOrTooHigh extends Error {
  override name = "SwapExchangeRateAmountTooLowOrTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SwapGenericAPIError extends Error {
  override name = "SwapGenericAPIError";
}

export class SwapRateExpiredError extends Error {
  override name = "SwapRateExpiredError";
}

export class JSONRPCResponseError extends Error {
  override name = "JSONRPCResponseError";
}

export class JSONDecodeError extends Error {
  override name = "JSONDecodeError";
}

export class NoIPHeaderError extends Error {
  override name = "NoIPHeaderError";
}

export class CurrencyNotSupportedError extends Error {
  override name = "CurrencyNotSupportedError";
}

export class CurrencyDisabledError extends Error {
  override name = "CurrencyDisabledError";
}

export class CurrencyDisabledAsInputError extends Error {
  override name = "CurrencyDisabledAsInputError";
}

export class CurrencyDisabledAsOutputError extends Error {
  override name = "CurrencyDisabledAsOutputError";
}

export class CurrencyNotSupportedByProviderError extends Error {
  override name = "CurrencyNotSupportedByProviderError";
}

export class TradeMethodNotSupportedError extends Error {
  override name = "TradeMethodNotSupportedError";
}

export class UnexpectedError extends Error {
  override name = "UnexpectedError";
}

export class NotImplementedError extends Error {
  override name = "NotImplementedError";
}

// Thrown by account.getPublicKey when no usable public key is available for the account. The
// class name is a stable identifier consumers match on across the wallet-api transport (e.g.
// WalletConnect).
export class AccountPublicKeyUnavailable extends Error {
  override name = "AccountPublicKeyUnavailable";
}

export class ValidationError extends Error {
  override name = "ValidationError";
}

export class AccessDeniedError extends Error {
  override name = "AccessDeniedError";
}

export class OutdatedApp extends Error {
  override name = "OutdatedApp";
}

export class BluetoothNotSupportedError extends Error {
  override name = "FwUpdateBluetoothNotSupported";
}

export class EConnResetError extends Error {
  override name = "EConnReset";
}

export class PasswordsDontMatchError extends Error {
  override name = "PasswordsDontMatch";
}

export class PasswordIncorrectError extends Error {
  override name = "PasswordIncorrect";
}

export class NotSupportedLegacyAddress extends Error {
  override name = "NotSupportedLegacyAddress";
}

export class DeviceOnDashboardExpected extends Error {
  override name = "DeviceOnDashboardExpected";
}

export class DeviceOnDashboardUnexpected extends Error {
  override name = "DeviceOnDashboardUnexpected";
}

export class DeviceInOSUExpected extends Error {
  override name = "DeviceInOSUExpected";
}

export class DeviceHalted extends Error {
  override name = "DeviceHalted";
}

export class DeviceSocketFail extends Error {
  override name = "DeviceSocketFail";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class DeviceOnboardingStatePollingError extends Error {
  override name = "DeviceOnboardingStatePollingError";
}

export class DeviceExtractOnboardingStateError extends Error {
  override name = "DeviceExtractOnboardingStateError";
}

export class DeviceAppVerifyNotSupported extends Error {
  override name = "DeviceAppVerifyNotSupported";
}

export class UnresponsiveDeviceError extends Error {
  override name = "UnresponsiveDeviceError";
}

export class WebsocketConnectionError extends Error {
  override name = "WebsocketConnectionError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ManagerAppAlreadyInstalledError extends Error {
  override name = "ManagerAppAlreadyInstalled";
}

export class ManagerAppRelyOnBTCError extends Error {
  override name = "ManagerAppRelyOnBTC";
}

export class ManagerAppDepInstallRequired extends Error {
  override name = "ManagerAppDepInstallRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ManagerAppDepUninstallRequired extends Error {
  override name = "ManagerAppDepUninstallRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ManagerDeviceLockedError extends Error {
  override name = "ManagerDeviceLocked";
}

export class ManagerFirmwareNotEnoughSpaceError extends Error {
  override name = "ManagerFirmwareNotEnoughSpace";
}

export class ManagerNotEnoughSpaceError extends Error {
  override name = "ManagerNotEnoughSpace";
}

export class UnsupportedFeatureError extends Error {
  override name = "UnsupportedFeatureError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class LanguageNotFound extends Error {
  override name = "LanguageNotFound";
}

export class FirmwareNotRecognized extends Error {
  override name = "FirmwareNotRecognized";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class FirmwareOrAppUpdateRequired extends Error {
  override name = "FirmwareOrAppUpdateRequired";
}

export class LatestFirmwareVersionRequired extends Error {
  override name = "LatestFirmwareVersionRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class UnexpectedBootloader extends Error {
  override name = "UnexpectedBootloader";
}

export class MCUNotGenuineToDashboard extends Error {
  override name = "MCUNotGenuineToDashboard";
}

export class AccountNotSupported extends Error {
  override name = "AccountNotSupported";
}

export class AccountAwaitingSendPendingOperations extends Error {
  override name = "AccountAwaitingSendPendingOperations";
}

export class NoAddressesFound extends Error {
  override name = "NoAddressesFound";
}

export class CurrencyNotSupported extends Error {
  override name = "CurrencyNotSupported";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export { NetworkDown, LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/live-network/errors";

export class NetworkError extends Error {
  override name = "NetworkError";
}

export class LedgerAPIError extends Error {
  override name = "LedgerAPIError";
}

export class LedgerAPIErrorWithMessage extends Error {
  override name = "LedgerAPIErrorWithMessage";
}

export class LedgerAPINotAvailable extends Error {
  override name = "LedgerAPINotAvailable";
}

export class RecommendSubAccountsToEmpty extends Error {
  override name = "RecommendSubAccountsToEmpty";
}

export class RecommendUndelegation extends Error {
  override name = "RecommendUndelegation";
}

export class ReplacementTransactionUnderpriced extends Error {
  override name = "ReplacementTransactionUnderpriced";
}

export class NotEnoughBalanceSwap extends Error {
  override name = "NotEnoughBalanceSwap";
}

export class NotEnoughGasSwap extends Error {
  override name = "NotEnoughGasSwap";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class FeeNotLoadedSwap extends Error {
  override name = "FeeNotLoadedSwap";
}

export class MissingSwapPayloadParamaters extends Error {
  override name = "MissingSwapPayloadParamaters";
}

export class UserRefusedDeviceNameChange extends Error {
  override name = "UserRefusedDeviceNameChange";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class UserRefusedAddress extends Error {
  override name = "UserRefusedAddress";
}

export class UserRefusedFirmwareUpdate extends Error {
  override name = "UserRefusedFirmwareUpdate";
}

export class UserRefusedAllowManager extends Error {
  override name = "UserRefusedAllowManager";
}

export class WrongDeviceForAccountPayout extends Error {
  override name = "WrongDeviceForAccountPayout";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class WrongDeviceForAccountRefund extends Error {
  override name = "WrongDeviceForAccountRefund";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PairingFailed extends Error {
  override name = "PairingFailed";
}

export class PeerRemovedPairing extends Error {
  override name = "PeerRemovedPairing";
}

export class GenuineCheckFailed extends Error {
  override name = "GenuineCheckFailed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class DisabledTransactionBroadcastError extends Error {
  override name = "DisabledTransactionBroadcastError";
}

export class SyncError extends Error {
  override name = "SyncError";
}

export class PendingOperation extends Error {
  override name = "PendingOperation";
}

export class TimeoutTagged extends Error {
  override name = "TimeoutTagged";
}

export class InvalidParameterError extends Error {
  override name = "InvalidParameterError";
}

export class DeviceNotGenuineError extends Error {
  override name = "DeviceNotGenuine";
}

export class DeviceGenuineSocketEarlyClose extends Error {
  override name = "DeviceGenuineSocketEarlyClose";
}

export class UnknownMCU extends Error {
  override name = "UnknownMCU";
}

export class PinNotSet extends Error {
  override name = "PinNotSet";
}

export class ExpertModeRequired extends Error {
  override name = "ExpertModeRequired";
}

export class DeviceNameInvalid extends Error {
  override name = "DeviceNameInvalid";
}

export class NanoSNotSupported extends Error {
  override name = "NanoSNotSupported";
}

export class HardResetFail extends Error {
  override name = "HardResetFail";
}

export class LatestMCUInstalledError extends Error {
  override name = "LatestMCUInstalledError";
}

export class DeviceSocketNoBulkStatus extends Error {
  override name = "DeviceSocketNoBulkStatus";
}

export class UpdateYourApp extends Error {
  override name = "UpdateYourApp";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NoAccessToCamera extends Error {
  override name = "NoAccessToCamera";
}

export class TransactionHasBeenValidatedError extends Error {
  override name = "TransactionHasBeenValidatedError";
}

export class CantScanQRCode extends Error {
  override name = "CantScanQRCode";
}

export class WrongAppForCurrency extends Error {
  override name = "WrongAppForCurrency";
}

export class BtcUnmatchedApp extends Error {
  override name = "BtcUnmatchedApp";
}

export class WebsocketConnectionFailed extends Error {
  override name = "WebsocketConnectionFailed";
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
