import {
  serializeError,
  deserializeError,
  createCustomErrorClass,
  addCustomErrorDeserializer,
} from "./helpers";

/**
 * @deprecated `@ledgerhq/errors` is being sunset; kept for backward compatibility.
 * Instead of `createCustomErrorClass`, define a real class:
 * `class MyError extends Error { override name = "MyError" }`. Instead of
 * serialize/deserialize, transfer `{ name, message }` and rebuild a plain `Error`.
 */
export { serializeError, deserializeError, createCustomErrorClass, addCustomErrorDeserializer };

/**
 * Base class for the shared Ledger errors that still live in this package.
 *
 * Replaces the former `createCustomErrorClass` factory: errors are now real,
 * tree-shakeable classes. Subclasses only set `static override errorName`; the
 * base preserves the historical contract — `instanceof`, `name`, a `message`
 * that defaults to the error name, optional `fields`, and native `cause`
 * (passed through `options`).
 */
export type LedgerErrorOptions = { cause?: unknown };

export class LedgerError extends Error {
  static errorName = "LedgerError";
  cause?: unknown;

  constructor(message?: string, fields?: Record<string, unknown>, options?: LedgerErrorOptions) {
    const name = (new.target as typeof LedgerError).errorName;
    super(message || name);
    this.name = name;
    Object.setPrototypeOf(this, new.target.prototype);
    if (fields) {
      Object.assign(this, fields);
    }
    if (options && typeof options === "object" && "cause" in options) {
      this.cause = options.cause;
      const cause = options.cause as { stack?: string } | null;
      if (cause && typeof cause === "object" && "stack" in cause) {
        this.stack = this.stack + "\nCAUSE: " + cause.stack;
      }
    }
  }
}

export class AccountNameRequiredError extends LedgerError {
  static override errorName = "AccountNameRequired";
}
export class AccountNotSupported extends LedgerError {
  static override errorName = "AccountNotSupported";
}
export class AccountAwaitingSendPendingOperations extends LedgerError {
  static override errorName = "AccountAwaitingSendPendingOperations";
}
export class AmountRequired extends LedgerError {
  static override errorName = "AmountRequired";
}
export class BluetoothRequired extends LedgerError {
  static override errorName = "BluetoothRequired";
}
export class BtcUnmatchedApp extends LedgerError {
  static override errorName = "BtcUnmatchedApp";
}
export class CantOpenDevice extends LedgerError {
  static override errorName = "CantOpenDevice";
}
export class CashAddrNotSupported extends LedgerError {
  static override errorName = "CashAddrNotSupported";
}
export class ClaimRewardsFeesWarning extends LedgerError {
  static override errorName = "ClaimRewardsFeesWarning";
}
export class CurrencyNotSupported extends LedgerError {
  static override errorName = "CurrencyNotSupported";
  declare currencyName: string;
  constructor(message?: string, fields?: { currencyName: string }, options?: LedgerErrorOptions) {
    super(message, fields, options);
  }
}
export class DeviceAppVerifyNotSupported extends LedgerError {
  static override errorName = "DeviceAppVerifyNotSupported";
}
export class DeviceGenuineSocketEarlyClose extends LedgerError {
  static override errorName = "DeviceGenuineSocketEarlyClose";
}
export class DeviceNotGenuineError extends LedgerError {
  static override errorName = "DeviceNotGenuine";
}
export class DeviceOnDashboardExpected extends LedgerError {
  static override errorName = "DeviceOnDashboardExpected";
}
export class DeviceOnDashboardUnexpected extends LedgerError {
  static override errorName = "DeviceOnDashboardUnexpected";
}
export class DeviceInOSUExpected extends LedgerError {
  static override errorName = "DeviceInOSUExpected";
}
export class DeviceHalted extends LedgerError {
  static override errorName = "DeviceHalted";
}
export class DeviceNameInvalid extends LedgerError {
  static override errorName = "DeviceNameInvalid";
}
export class DeviceSocketFail extends LedgerError {
  static override errorName = "DeviceSocketFail";
}
export class DeviceSocketNoBulkStatus extends LedgerError {
  static override errorName = "DeviceSocketNoBulkStatus";
}
export class DeviceNeedsRestart extends LedgerError {
  static override errorName = "DeviceSocketNoBulkStatus";
}
export class UnresponsiveDeviceError extends LedgerError {
  static override errorName = "UnresponsiveDeviceError";
}
export class DisconnectedDevice extends LedgerError {
  static override errorName = "DisconnectedDevice";
}
export class DisconnectedDeviceDuringOperation extends LedgerError {
  static override errorName = "DisconnectedDeviceDuringOperation";
}
export class DeviceExtractOnboardingStateError extends LedgerError {
  static override errorName = "DeviceExtractOnboardingStateError";
}
export class DeviceOnboardingStatePollingError extends LedgerError {
  static override errorName = "DeviceOnboardingStatePollingError";
}
export class EnpointConfigError extends LedgerError {
  static override errorName = "EnpointConfig";
}
export class EthAppPleaseEnableContractData extends LedgerError {
  static override errorName = "EthAppPleaseEnableContractData";
}
export class SolAppPleaseEnableContractData extends LedgerError {
  static override errorName = "SolAppPleaseEnableContractData";
}
export class CeloAppPleaseEnableContractData extends LedgerError {
  static override errorName = "CeloAppPleaseEnableContractData";
}
export class FeeEstimationFailed extends LedgerError {
  static override errorName = "FeeEstimationFailed";
}
export class FirmwareNotRecognized extends LedgerError {
  static override errorName = "FirmwareNotRecognized";
}
export class HardResetFail extends LedgerError {
  static override errorName = "HardResetFail";
}
export class InvalidXRPTag extends LedgerError {
  static override errorName = "InvalidXRPTag";
}
export class InvalidAddress extends LedgerError {
  static override errorName = "InvalidAddress";
}
export class InvalidTransactionError extends LedgerError {
  static override errorName = "InvalidTransactionError";
}
export class InvalidNonce extends LedgerError {
  static override errorName = "InvalidNonce";
}
export class InvalidAddressBecauseDestinationIsAlsoSource extends LedgerError {
  static override errorName = "InvalidAddressBecauseDestinationIsAlsoSource";
}
export class LatestMCUInstalledError extends LedgerError {
  static override errorName = "LatestMCUInstalledError";
}
export class LatestFirmwareVersionRequired extends LedgerError {
  static override errorName = "LatestFirmwareVersionRequired";
}
export class UnsupportedFeatureError extends LedgerError {
  static override errorName = "UnsupportedFeatureError";
}
export class NanoSNotSupported extends LedgerError {
  static override errorName = "NanoSNotSupported";
}
export class UnknownMCU extends LedgerError {
  static override errorName = "UnknownMCU";
}
export class LedgerAPIError extends LedgerError {
  static override errorName = "LedgerAPIError";
}
export class LedgerAPIErrorWithMessage extends LedgerError {
  static override errorName = "LedgerAPIErrorWithMessage";
}
export class LedgerAPINotAvailable extends LedgerError {
  static override errorName = "LedgerAPINotAvailable";
}
export class ManagerAppAlreadyInstalledError extends LedgerError {
  static override errorName = "ManagerAppAlreadyInstalled";
}
export class ManagerAppRelyOnBTCError extends LedgerError {
  static override errorName = "ManagerAppRelyOnBTC";
}
export class ManagerAppDepInstallRequired extends LedgerError {
  static override errorName = "ManagerAppDepInstallRequired";
}
export class ManagerAppDepUninstallRequired extends LedgerError {
  static override errorName = "ManagerAppDepUninstallRequired";
}
export class ManagerDeviceLockedError extends LedgerError {
  static override errorName = "ManagerDeviceLocked";
}
export class ManagerFirmwareNotEnoughSpaceError extends LedgerError {
  static override errorName = "ManagerFirmwareNotEnoughSpace";
}
export class ManagerNotEnoughSpaceError extends LedgerError {
  static override errorName = "ManagerNotEnoughSpace";
}
export class ManagerUninstallBTCDep extends LedgerError {
  static override errorName = "ManagerUninstallBTCDep";
}
export class NetworkDown extends LedgerError {
  static override errorName = "NetworkDown";
}
export class NetworkError extends LedgerError {
  static override errorName = "NetworkError";
}
export class NoAddressesFound extends LedgerError {
  static override errorName = "NoAddressesFound";
}
export class NotEnoughBalance extends LedgerError {
  static override errorName = "NotEnoughBalance";
}
export class NotEnoughBalanceFees extends LedgerError {
  static override errorName = "NotEnoughBalanceFees";
}
export class NotEnoughBalanceSwap extends LedgerError {
  static override errorName = "NotEnoughBalanceSwap";
}
export class NotEnoughBalanceToDelegate extends LedgerError {
  static override errorName = "NotEnoughBalanceToDelegate";
}
export class UnstakeNotEnoughStakedBalanceLeft extends LedgerError {
  static override errorName = "UnstakeNotEnoughStakedBalanceLeft";
}
export class RestakeNotEnoughStakedBalanceLeft extends LedgerError {
  static override errorName = "RestakeNotEnoughStakedBalanceLeft";
}

export class NotEnoughToRestake extends LedgerError {
  static override errorName = "NotEnoughToRestake";
}
export class NotEnoughToUnstake extends LedgerError {
  static override errorName = "NotEnoughToUnstake";
}
export class NotEnoughBalanceInParentAccount extends LedgerError {
  static override errorName = "NotEnoughBalanceInParentAccount";
}
export class NotEnoughSpendableBalance extends LedgerError {
  static override errorName = "NotEnoughSpendableBalance";
}
export class NotEnoughBalanceBecauseDestinationNotCreated extends LedgerError {
  static override errorName = "NotEnoughBalanceBecauseDestinationNotCreated";
}
export class NotEnoughToStake extends LedgerError {
  static override errorName = "NotEnoughToStake";
}
export class NoAccessToCamera extends LedgerError {
  static override errorName = "NoAccessToCamera";
}
export class NotEnoughGas extends LedgerError {
  static override errorName = "NotEnoughGas";
}
// Error message specifically for the PTX swap flow
export class NotEnoughGasSwap extends LedgerError {
  static override errorName = "NotEnoughGasSwap";
}
export class TronEmptyAccount extends LedgerError {
  static override errorName = "TronEmptyAccount";
}
export class MaybeKeepTronAccountAlive extends LedgerError {
  static override errorName = "MaybeKeepTronAccountAlive";
}
export class NotSupportedLegacyAddress extends LedgerError {
  static override errorName = "NotSupportedLegacyAddress";
}
export class GasLessThanEstimate extends LedgerError {
  static override errorName = "GasLessThanEstimate";
}
export class PriorityFeeTooLow extends LedgerError {
  static override errorName = "PriorityFeeTooLow";
}
export class PriorityFeeTooHigh extends LedgerError {
  static override errorName = "PriorityFeeTooHigh";
}
export class PriorityFeeHigherThanMaxFee extends LedgerError {
  static override errorName = "PriorityFeeHigherThanMaxFee";
}
export class MaxFeeTooLow extends LedgerError {
  static override errorName = "MaxFeeTooLow";
}
export class PasswordsDontMatchError extends LedgerError {
  static override errorName = "PasswordsDontMatch";
}
export class PasswordIncorrectError extends LedgerError {
  static override errorName = "PasswordIncorrect";
}
export class RecommendSubAccountsToEmpty extends LedgerError {
  static override errorName = "RecommendSubAccountsToEmpty";
}
export class RecommendUndelegation extends LedgerError {
  static override errorName = "RecommendUndelegation";
}
export class TimeoutTagged extends LedgerError {
  static override errorName = "TimeoutTagged";
}
export class UnexpectedBootloader extends LedgerError {
  static override errorName = "UnexpectedBootloader";
}
export class MCUNotGenuineToDashboard extends LedgerError {
  static override errorName = "MCUNotGenuineToDashboard";
}
export class RecipientRequired extends LedgerError {
  static override errorName = "RecipientRequired";
}
export class UnavailableTezosOriginatedAccountReceive extends LedgerError {
  static override errorName = "UnavailableTezosOriginatedAccountReceive";
}
export class UnavailableTezosOriginatedAccountSend extends LedgerError {
  static override errorName = "UnavailableTezosOriginatedAccountSend";
}
export class UpdateFetchFileFail extends LedgerError {
  static override errorName = "UpdateFetchFileFail";
}
export class UpdateIncorrectHash extends LedgerError {
  static override errorName = "UpdateIncorrectHash";
}
export class UpdateIncorrectSig extends LedgerError {
  static override errorName = "UpdateIncorrectSig";
}
export class UpdateYourApp extends LedgerError {
  static override errorName = "UpdateYourApp";
}
export class UserRefusedDeviceNameChange extends LedgerError {
  static override errorName = "UserRefusedDeviceNameChange";
}
export class UserRefusedAddress extends LedgerError {
  static override errorName = "UserRefusedAddress";
}
export class UserRefusedFirmwareUpdate extends LedgerError {
  static override errorName = "UserRefusedFirmwareUpdate";
}
export class UserRefusedAllowManager extends LedgerError {
  static override errorName = "UserRefusedAllowManager";
}
export class UserRefusedOnDevice extends LedgerError {
  static override errorName = "UserRefusedOnDevice";
} // TODO rename because it's just for transaction refusal
export class PinNotSet extends LedgerError {
  static override errorName = "PinNotSet";
}
export class ExpertModeRequired extends LedgerError {
  static override errorName = "ExpertModeRequired";
}
export class TransportOpenUserCancelled extends LedgerError {
  static override errorName = "TransportOpenUserCancelled";
}
export class TransportInterfaceNotAvailable extends LedgerError {
  static override errorName = "TransportInterfaceNotAvailable";
}
export class TransportRaceCondition extends LedgerError {
  static override errorName = "TransportRaceCondition";
}
export class TransportWebUSBGestureRequired extends LedgerError {
  static override errorName = "TransportWebUSBGestureRequired";
}
export class TransactionHasBeenValidatedError extends LedgerError {
  static override errorName = "TransactionHasBeenValidatedError";
}
export class TransportExchangeTimeoutError extends LedgerError {
  static override errorName = "TransportExchangeTimeoutError";
}
export class DeviceShouldStayInApp extends LedgerError {
  static override errorName = "DeviceShouldStayInApp";
}
export class WebsocketConnectionError extends LedgerError {
  static override errorName = "WebsocketConnectionError";
}
export class WebsocketConnectionFailed extends LedgerError {
  static override errorName = "WebsocketConnectionFailed";
}
export class WrongDeviceForAccount extends LedgerError {
  static override errorName = "WrongDeviceForAccount";
}
export class WrongDeviceForAccountPayout extends LedgerError {
  static override errorName = "WrongDeviceForAccountPayout";
}
export class MissingSwapPayloadParamaters extends LedgerError {
  static override errorName = "MissingSwapPayloadParamaters";
}
export class WrongDeviceForAccountRefund extends LedgerError {
  static override errorName = "WrongDeviceForAccountRefund";
}
export class WrongAppForCurrency extends LedgerError {
  static override errorName = "WrongAppForCurrency";
}

export class ETHAddressNonEIP extends LedgerError {
  static override errorName = "ETHAddressNonEIP";
}
export class CantScanQRCode extends LedgerError {
  static override errorName = "CantScanQRCode";
}
export class FeeNotLoaded extends LedgerError {
  static override errorName = "FeeNotLoaded";
}
export class FeeNotLoadedSwap extends LedgerError {
  static override errorName = "FeeNotLoadedSwap";
}
export class FeeRequired extends LedgerError {
  static override errorName = "FeeRequired";
}
export class FeeTooHigh extends LedgerError {
  static override errorName = "FeeTooHigh";
}
export class ValAddressRequired extends LedgerError {
  static override errorName = "ValAddressRequired";
}
export class RedelegateDstValAddressRequired extends LedgerError {
  static override errorName = "RedelegateDstValAddressRequired";
}
export class PendingOperation extends LedgerError {
  static override errorName = "PendingOperation";
}
export class SyncError extends LedgerError {
  static override errorName = "SyncError";
}
export class PairingFailed extends LedgerError {
  static override errorName = "PairingFailed";
}
export class PeerRemovedPairing extends LedgerError {
  static override errorName = "PeerRemovedPairing";
}
export class GenuineCheckFailed extends LedgerError {
  static override errorName = "GenuineCheckFailed";
}
type NetworkType = {
  status: number;
  url: string | undefined;
  method: string;
};
export class LedgerAPI4xx extends LedgerError {
  static override errorName = "LedgerAPI4xx";
  declare status: number;
  declare url: string | undefined;
  declare method: string;
  constructor(message?: string, fields?: NetworkType, options?: LedgerErrorOptions) {
    super(message, fields, options);
  }
}
export class LedgerAPI5xx extends LedgerError {
  static override errorName = "LedgerAPI5xx";
  declare status: number;
  declare url: string | undefined;
  declare method: string;
  constructor(message?: string, fields?: NetworkType, options?: LedgerErrorOptions) {
    super(message, fields, options);
  }
}
export class FirmwareOrAppUpdateRequired extends LedgerError {
  static override errorName = "FirmwareOrAppUpdateRequired";
}

// SpeedUp / Cancel EVM tx
export class ReplacementTransactionUnderpriced extends LedgerError {
  static override errorName = "ReplacementTransactionUnderpriced";
}

// Bitcoin family
export class OpReturnDataSizeLimit extends LedgerError {
  static override errorName = "OpReturnSizeLimit";
}
export class DustLimit extends LedgerError {
  static override errorName = "DustLimit";
}

// Concordium family
export class ConcordiumInsufficientFunds extends LedgerError {
  static override errorName = "ConcordiumInsufficientFunds";
}
export class ConcordiumMemoTooLong extends LedgerError {
  static override errorName = "ConcordiumMemoTooLong";
}
export class ConcordiumPairingExpiredError extends LedgerError {
  static override errorName = "ConcordiumPairingExpiredError";
}
export class ConcordiumSessionExpiredError extends LedgerError {
  static override errorName = "ConcordiumSessionExpiredError";
}
export class ConcordiumTrustedMetadataServiceError extends LedgerError {
  static override errorName = "ConcordiumTrustedMetadataServiceError";
}
export class ConcordiumAddressVerificationFailedError extends LedgerError {
  static override errorName = "ConcordiumAddressVerificationFailedError";
}
export class ConcordiumInvalidMaxFeeError extends LedgerError {
  static override errorName = "ConcordiumInvalidMaxFeeError";
}

// Language
export class LanguageNotFound extends LedgerError {
  static override errorName = "LanguageNotFound";
}

// db stuff, no need to translate
export class NoDBPathGiven extends LedgerError {
  static override errorName = "NoDBPathGiven";
}
export class DBWrongPassword extends LedgerError {
  static override errorName = "DBWrongPassword";
}
export class DBNotReset extends LedgerError {
  static override errorName = "DBNotReset";
}

export class SequenceNumberError extends LedgerError {
  static override errorName = "SequenceNumberError";
}
export class DisabledTransactionBroadcastError extends LedgerError {
  static override errorName = "DisabledTransactionBroadcastError";
}

export class InvalidParameterError extends LedgerError {
  static override errorName = "InvalidParameterError";
}

/**
 * Type of a Transport error used to represent all equivalent errors coming from all possible implementation of Transport
 */
export enum HwTransportErrorType {
  Unknown = "Unknown",
  LocationServicesDisabled = "LocationServicesDisabled",
  LocationServicesUnauthorized = "LocationServicesUnauthorized",
  BluetoothScanStartFailed = "BluetoothScanStartFailed",
}

/**
 * Represents an error coming from the usage of any Transport implementation.
 *
 * Needed to map a specific implementation error into an error that
 * can be managed by any code unaware of the specific Transport implementation
 * that was used.
 */
export class HwTransportError extends Error {
  type: HwTransportErrorType;

  constructor(type: HwTransportErrorType, message: string) {
    super(message);
    this.name = "HwTransportError";
    this.type = type;

    // Needed as long as we target < ES6
    Object.setPrototypeOf(this, HwTransportError.prototype);
  }
}

/**
 * TransportError is used for any generic transport errors.
 * e.g. Error thrown when data received by exchanges are incorrect or if exchanged failed to communicate with the device for various reason.
 */
export class TransportError extends Error {
  id: string;
  constructor(message: string, id: string) {
    const name = "TransportError";
    super(message || name);
    this.name = name;
    this.message = message;
    this.stack = new Error(message).stack;
    this.id = id;
  }
}

addCustomErrorDeserializer("TransportError", e => new TransportError(e.message, e.id));

export const StatusCodes = {
  ACCESS_CONDITION_NOT_FULFILLED: 0x9804,
  ALGORITHM_NOT_SUPPORTED: 0x9484,
  CLA_NOT_SUPPORTED: 0x6e00,
  CLA_NOT_SUPPORTED_BOOTLOADER: 0x6e01,
  CODE_BLOCKED: 0x9840,
  CODE_NOT_INITIALIZED: 0x9802,
  COMMAND_INCOMPATIBLE_FILE_STRUCTURE: 0x6981,
  CONDITIONS_OF_USE_NOT_SATISFIED: 0x6985,
  CONTRADICTION_INVALIDATION: 0x9810,
  CONTRADICTION_SECRET_CODE_STATUS: 0x9808,
  DEVICE_IN_RECOVERY_MODE: 0x662f,
  CUSTOM_IMAGE_EMPTY: 0x662e,
  FILE_ALREADY_EXISTS: 0x6a89,
  FILE_NOT_FOUND: 0x9404,
  GP_AUTH_FAILED: 0x6300,
  HALTED: 0x6faa,
  INCONSISTENT_FILE: 0x9408,
  INCORRECT_DATA: 0x6a80,
  INCORRECT_LENGTH: 0x6700,
  INCORRECT_P1_P2: 0x6b00,
  INS_NOT_SUPPORTED: 0x6d00,
  DEVICE_NOT_ONBOARDED: 0x6d07,
  DEVICE_NOT_ONBOARDED_2: 0x6611,
  INVALID_KCV: 0x9485,
  INVALID_OFFSET: 0x9402,
  LICENSING: 0x6f42,
  LOCKED_DEVICE: 0x5515,
  MAX_VALUE_REACHED: 0x9850,
  MEMORY_PROBLEM: 0x9240,
  MISSING_CRITICAL_PARAMETER: 0x6800,
  NO_EF_SELECTED: 0x9400,
  NOT_ENOUGH_MEMORY_SPACE: 0x6a84,
  OK: 0x9000,
  PIN_REMAINING_ATTEMPTS: 0x63c0,
  REFERENCED_DATA_NOT_FOUND: 0x6a88,
  SECURITY_STATUS_NOT_SATISFIED: 0x6982,
  TECHNICAL_PROBLEM: 0x6f00,
  UNKNOWN_APDU: 0x6d02,
  USER_REFUSED_ON_DEVICE: 0x5501,
  NOT_ENOUGH_SPACE: 0x5102,
  APP_NOT_FOUND_OR_INVALID_CONTEXT: 0x5123,
  INVALID_APP_NAME_LENGTH: 0x670a,
  GEN_AES_KEY_FAILED: 0x5419,
  INTERNAL_CRYPTO_OPERATION_FAILED: 0x541a,
  INTERNAL_COMPUTE_AES_CMAC_FAILED: 0x541b,
  ENCRYPT_APP_STORAGE_FAILED: 0x541c,
  INVALID_BACKUP_STATE: 0x6642,
  PIN_NOT_SET: 0x5502,
  INVALID_BACKUP_LENGTH: 0x6733,
  INVALID_RESTORE_STATE: 0x6643,
  INVALID_CHUNK_LENGTH: 0x6734,
  INVALID_BACKUP_HEADER: 0x684a,
  SW_BAD_STATE: 0xb007,
};

export function getAltStatusMessage(code: number): string | undefined | null {
  switch (code) {
    // improve text of most common errors
    case 0x6700:
      return "Incorrect length";
    case 0x6800:
      return "Missing critical parameter";
    case 0x6982:
      return "Security not satisfied (dongle locked or have invalid access rights)";
    case 0x6985:
      return "Condition of use not satisfied (denied by the user?)";
    case 0x6a80:
      return "Invalid data received";
    case 0x6b00:
      return "Invalid parameter received";
    case 0x5515:
      return "Locked device";
    case 0xb007:
      return "Unexpected state on the device";
  }
  if (0x6f00 <= code && code <= 0x6fff) {
    return "Internal error, please report";
  }
}

/**
 * Error thrown when a device returned a non success status.
 * the error.statusCode is one of the `StatusCodes` exported by this library.
 */
export class TransportStatusError extends Error {
  statusCode: number;
  statusText: string;

  /**
   * @param statusCode The error status code coming from a Transport implementation
   * @param options containing:
   *  - canBeMappedToChildError: enable the mapping of TransportStatusError to an error extending/inheriting from it
   *  . Ex: LockedDeviceError. Default to true.
   */
  constructor(
    statusCode: number,
    { canBeMappedToChildError = true }: { canBeMappedToChildError?: boolean } = {},
  ) {
    const statusText =
      Object.keys(StatusCodes).find(k => StatusCodes[k] === statusCode) || "UNKNOWN_ERROR";
    const smsg = getAltStatusMessage(statusCode) || statusText;
    const statusCodeStr = statusCode.toString(16);
    const message = `Ledger device: ${smsg} (0x${statusCodeStr})`;

    super(message);
    this.name = "TransportStatusError";

    this.statusCode = statusCode;
    this.statusText = statusText;

    Object.setPrototypeOf(this, TransportStatusError.prototype);

    // Maps to a LockedDeviceError
    if (canBeMappedToChildError && statusCode === StatusCodes.LOCKED_DEVICE) {
      return new LockedDeviceError(message);
    }
  }
}

export class LockedDeviceError extends TransportStatusError {
  constructor(message?: string) {
    super(StatusCodes.LOCKED_DEVICE, { canBeMappedToChildError: false });
    if (message) {
      this.message = message;
    }
    this.name = "LockedDeviceError";
    Object.setPrototypeOf(this, LockedDeviceError.prototype);
  }
}

export class DeviceMangementKitError extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
    Object.setPrototypeOf(this, DeviceMangementKitError.prototype);
  }
}

// Represents the type of the class TransportStatusError and its children
export type TransportStatusErrorClassType = typeof TransportStatusError | typeof LockedDeviceError;

addCustomErrorDeserializer("TransportStatusError", e => new TransportStatusError(e.statusCode));
