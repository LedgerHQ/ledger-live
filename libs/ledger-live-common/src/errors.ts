import { createCustomErrorClass } from "@ledgerhq/errors";
// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs
export const ConnectAppTimeout = createCustomErrorClass("ConnectAppTimeout");
export const ConnectManagerTimeout = createCustomErrorClass("ConnectManagerTimeout");
export const GetAppAndVersionUnsupportedFormat = createCustomErrorClass(
  "GetAppAndVersionUnsupportedFormat",
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
// Thrown by account.getPublicKey when no usable public key is available for the account. The
// class name is a stable identifier consumers match on across the wallet-api transport (e.g.
// WalletConnect).
export const AccountPublicKeyUnavailable = createCustomErrorClass("AccountPublicKeyUnavailable");
export const ValidationError = createCustomErrorClass("ValidationError");
export const AccessDeniedError = createCustomErrorClass("AccessDeniedError");
export const OutdatedApp = createCustomErrorClass("OutdatedApp");

export const BluetoothNotSupportedError = createCustomErrorClass("FwUpdateBluetoothNotSupported");

export const EConnResetError = createCustomErrorClass("EConnReset");

export { NetworkDown, LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/live-network/errors";
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

export class PasswordsDontMatchError extends Error {
  override name = "PasswordsDontMatch";
  constructor(message?: string) {
    super(message || "PasswordsDontMatch");
  }
}

export class PasswordIncorrectError extends Error {
  override name = "PasswordIncorrect";
  constructor(message?: string) {
    super(message || "PasswordIncorrect");
  }
}

export class UnresponsiveDeviceError extends Error {
  override name = "UnresponsiveDeviceError";
  constructor(message?: string) {
    super(message || "UnresponsiveDeviceError");
  }
}

export class UserRefusedDeviceNameChange extends Error {
  override name = "UserRefusedDeviceNameChange";
  [key: string]: unknown;
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

export class UserRefusedAllowManager extends Error {
  override name = "UserRefusedAllowManager";
  [key: string]: unknown;
  constructor(message?: string) {
    super(message || "UserRefusedAllowManager");
  }
}

export class GenuineCheckFailed extends Error {
  override name = "GenuineCheckFailed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "GenuineCheckFailed");
    if (fields) Object.assign(this, fields);
  }
}

export class PendingOperation extends Error {
  override name = "PendingOperation";
  constructor(message?: string) {
    super(message || "PendingOperation");
  }
}

export class DisabledTransactionBroadcastError extends Error {
  override name = "DisabledTransactionBroadcastError";
  constructor(message?: string) {
    super(message || "DisabledTransactionBroadcastError");
  }
}

export class MissingSwapPayloadParamaters extends Error {
  override name = "MissingSwapPayloadParamaters";
  constructor(message?: string) {
    super(message || "MissingSwapPayloadParamaters");
  }
}

export class ManagerDeviceLockedError extends Error {
  override name = "ManagerDeviceLocked";
  constructor(message?: string) {
    super(message || "ManagerDeviceLocked");
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

export class DeviceSocketFail extends Error {
  override name = "DeviceSocketFail";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DeviceSocketFail");
    if (fields) Object.assign(this, fields);
  }
}

export class WebsocketConnectionError extends Error {
  override name = "WebsocketConnectionError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "WebsocketConnectionError");
    if (fields) Object.assign(this, fields);
  }
}

export class UnexpectedBootloader extends Error {
  override name = "UnexpectedBootloader";
  constructor(message?: string) {
    super(message || "UnexpectedBootloader");
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

export class UserRefusedFirmwareUpdate extends Error {
  override name = "UserRefusedFirmwareUpdate";
  constructor(message?: string) {
    super(message || "UserRefusedFirmwareUpdate");
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
