import {
  serializeError,
  deserializeError,
  createCustomErrorClass,
  addCustomErrorDeserializer,
  LedgerErrorConstructor,
} from "./helpers";

export {
  serializeError,
  deserializeError,
  createCustomErrorClass,
  addCustomErrorDeserializer,
};

export const AccountNameRequiredError = createCustomErrorClass(
  "AccountNameRequired"
);
export const AccountNotSupported = createCustomErrorClass(
  "AccountNotSupported"
);
export const AmountRequired = createCustomErrorClass("AmountRequired");
export const BluetoothRequired = createCustomErrorClass("BluetoothRequired");
export const BtcUnmatchedApp = createCustomErrorClass("BtcUnmatchedApp");
export const CantOpenDevice = createCustomErrorClass("CantOpenDevice");
export const CashAddrNotSupported = createCustomErrorClass(
  "CashAddrNotSupported"
);
export const CurrencyNotSupported = createCustomErrorClass<
  { currencyName: string },
  LedgerErrorConstructor<{ currencyName: string }>
>("CurrencyNotSupported");
export const DeviceAppVerifyNotSupported = createCustomErrorClass(
  "DeviceAppVerifyNotSupported"
);
export const DeviceGenuineSocketEarlyClose = createCustomErrorClass(
  "DeviceGenuineSocketEarlyClose"
);
export const DeviceNotGenuineError = createCustomErrorClass("DeviceNotGenuine");
export const DeviceOnDashboardExpected = createCustomErrorClass(
  "DeviceOnDashboardExpected"
);
export const DeviceOnDashboardUnexpected = createCustomErrorClass(
  "DeviceOnDashboardUnexpected"
);
export const DeviceInOSUExpected = createCustomErrorClass(
  "DeviceInOSUExpected"
);
export const DeviceHalted = createCustomErrorClass("DeviceHalted");
export const DeviceNameInvalid = createCustomErrorClass("DeviceNameInvalid");
export const DeviceSocketFail = createCustomErrorClass("DeviceSocketFail");
export const DeviceSocketNoBulkStatus = createCustomErrorClass(
  "DeviceSocketNoBulkStatus"
);
export const LockedDeviceError = createCustomErrorClass("LockedDeviceError");
export const DisconnectedDevice = createCustomErrorClass("DisconnectedDevice");
export const DisconnectedDeviceDuringOperation = createCustomErrorClass(
  "DisconnectedDeviceDuringOperation"
);
export const DeviceExtractOnboardingStateError = createCustomErrorClass(
  "DeviceExtractOnboardingStateError"
);
export const DeviceOnboardingStatePollingError = createCustomErrorClass(
  "DeviceOnboardingStatePollingError"
);
export const EnpointConfigError = createCustomErrorClass("EnpointConfig");
export const EthAppPleaseEnableContractData = createCustomErrorClass(
  "EthAppPleaseEnableContractData"
);
export const FeeEstimationFailed = createCustomErrorClass(
  "FeeEstimationFailed"
);
export const FirmwareNotRecognized = createCustomErrorClass(
  "FirmwareNotRecognized"
);
export const HardResetFail = createCustomErrorClass("HardResetFail");
export const InvalidXRPTag = createCustomErrorClass("InvalidXRPTag");
export const InvalidAddress = createCustomErrorClass("InvalidAddress");
export const InvalidAddressBecauseDestinationIsAlsoSource =
  createCustomErrorClass("InvalidAddressBecauseDestinationIsAlsoSource");
export const LatestMCUInstalledError = createCustomErrorClass(
  "LatestMCUInstalledError"
);
export const UnknownMCU = createCustomErrorClass("UnknownMCU");
export const LedgerAPIError = createCustomErrorClass("LedgerAPIError");
export const LedgerAPIErrorWithMessage = createCustomErrorClass(
  "LedgerAPIErrorWithMessage"
);
export const LedgerAPINotAvailable = createCustomErrorClass(
  "LedgerAPINotAvailable"
);
export const ManagerAppAlreadyInstalledError = createCustomErrorClass(
  "ManagerAppAlreadyInstalled"
);
export const ManagerAppRelyOnBTCError = createCustomErrorClass(
  "ManagerAppRelyOnBTC"
);
export const ManagerAppDepInstallRequired = createCustomErrorClass(
  "ManagerAppDepInstallRequired"
);
export const ManagerAppDepUninstallRequired = createCustomErrorClass(
  "ManagerAppDepUninstallRequired"
);
export const ManagerDeviceLockedError = createCustomErrorClass(
  "ManagerDeviceLocked"
);
export const ManagerFirmwareNotEnoughSpaceError = createCustomErrorClass(
  "ManagerFirmwareNotEnoughSpace"
);
export const ManagerNotEnoughSpaceError = createCustomErrorClass(
  "ManagerNotEnoughSpace"
);
export const ManagerUninstallBTCDep = createCustomErrorClass(
  "ManagerUninstallBTCDep"
);
export const NetworkDown = createCustomErrorClass("NetworkDown");
export const NoAddressesFound = createCustomErrorClass("NoAddressesFound");
export const NotEnoughBalance = createCustomErrorClass("NotEnoughBalance");
export const NotEnoughBalanceToDelegate = createCustomErrorClass(
  "NotEnoughBalanceToDelegate"
);
export const NotEnoughBalanceInParentAccount = createCustomErrorClass(
  "NotEnoughBalanceInParentAccount"
);
export const NotEnoughSpendableBalance = createCustomErrorClass(
  "NotEnoughSpendableBalance"
);
export const NotEnoughBalanceBecauseDestinationNotCreated =
  createCustomErrorClass("NotEnoughBalanceBecauseDestinationNotCreated");
export const NoAccessToCamera = createCustomErrorClass("NoAccessToCamera");
export const NotEnoughGas = createCustomErrorClass("NotEnoughGas");
export const NotSupportedLegacyAddress = createCustomErrorClass(
  "NotSupportedLegacyAddress"
);
export const GasLessThanEstimate = createCustomErrorClass(
  "GasLessThanEstimate"
);
export const PriorityFeeTooLow = createCustomErrorClass("PriorityFeeTooLow");
export const PriorityFeeTooHigh = createCustomErrorClass("PriorityFeeTooHigh");
export const PriorityFeeHigherThanMaxFee = createCustomErrorClass(
  "PriorityFeeHigherThanMaxFee"
);
export const MaxFeeTooLow = createCustomErrorClass("MaxFeeTooLow");
export const PasswordsDontMatchError =
  createCustomErrorClass("PasswordsDontMatch");
export const PasswordIncorrectError =
  createCustomErrorClass("PasswordIncorrect");
export const RecommendSubAccountsToEmpty = createCustomErrorClass(
  "RecommendSubAccountsToEmpty"
);
export const RecommendUndelegation = createCustomErrorClass(
  "RecommendUndelegation"
);
export const TimeoutTagged = createCustomErrorClass("TimeoutTagged");
export const UnexpectedBootloader = createCustomErrorClass(
  "UnexpectedBootloader"
);
export const MCUNotGenuineToDashboard = createCustomErrorClass(
  "MCUNotGenuineToDashboard"
);
export const RecipientRequired = createCustomErrorClass("RecipientRequired");
export const UnavailableTezosOriginatedAccountReceive = createCustomErrorClass(
  "UnavailableTezosOriginatedAccountReceive"
);
export const UnavailableTezosOriginatedAccountSend = createCustomErrorClass(
  "UnavailableTezosOriginatedAccountSend"
);
export const UpdateFetchFileFail = createCustomErrorClass(
  "UpdateFetchFileFail"
);
export const UpdateIncorrectHash = createCustomErrorClass(
  "UpdateIncorrectHash"
);
export const UpdateIncorrectSig = createCustomErrorClass("UpdateIncorrectSig");
export const UpdateYourApp = createCustomErrorClass("UpdateYourApp");
export const UserRefusedDeviceNameChange = createCustomErrorClass(
  "UserRefusedDeviceNameChange"
);
export const UserRefusedAddress = createCustomErrorClass("UserRefusedAddress");
export const UserRefusedFirmwareUpdate = createCustomErrorClass(
  "UserRefusedFirmwareUpdate"
);
export const UserRefusedAllowManager = createCustomErrorClass(
  "UserRefusedAllowManager"
);
export const UserRefusedOnDevice = createCustomErrorClass(
  "UserRefusedOnDevice"
); // TODO rename because it's just for transaction refusal
export const TransportOpenUserCancelled = createCustomErrorClass(
  "TransportOpenUserCancelled"
);
export const TransportInterfaceNotAvailable = createCustomErrorClass(
  "TransportInterfaceNotAvailable"
);
export const TransportRaceCondition = createCustomErrorClass(
  "TransportRaceCondition"
);
export const TransportWebUSBGestureRequired = createCustomErrorClass(
  "TransportWebUSBGestureRequired"
);
export const DeviceShouldStayInApp = createCustomErrorClass(
  "DeviceShouldStayInApp"
);
export const WebsocketConnectionError = createCustomErrorClass(
  "WebsocketConnectionError"
);
export const WebsocketConnectionFailed = createCustomErrorClass(
  "WebsocketConnectionFailed"
);
export const WrongDeviceForAccount = createCustomErrorClass(
  "WrongDeviceForAccount"
);
export const WrongAppForCurrency = createCustomErrorClass(
  "WrongAppForCurrency"
);
export const ETHAddressNonEIP = createCustomErrorClass("ETHAddressNonEIP");
export const CantScanQRCode = createCustomErrorClass("CantScanQRCode");
export const FeeNotLoaded = createCustomErrorClass("FeeNotLoaded");
export const FeeRequired = createCustomErrorClass("FeeRequired");
export const FeeTooHigh = createCustomErrorClass("FeeTooHigh");
export const PendingOperation = createCustomErrorClass("PendingOperation");
export const SyncError = createCustomErrorClass("SyncError");
export const PairingFailed = createCustomErrorClass("PairingFailed");
export const GenuineCheckFailed = createCustomErrorClass("GenuineCheckFailed");
export const LedgerAPI4xx = createCustomErrorClass("LedgerAPI4xx");
export const LedgerAPI5xx = createCustomErrorClass("LedgerAPI5xx");
export const FirmwareOrAppUpdateRequired = createCustomErrorClass(
  "FirmwareOrAppUpdateRequired"
);

// Bitcoin family
export const OpReturnDataSizeLimit =
  createCustomErrorClass("OpReturnSizeLimit");
export const DustLimit = createCustomErrorClass("DustLimit");

// Language
export const LanguageNotFound = createCustomErrorClass("LanguageNotFound");

// db stuff, no need to translate
export const NoDBPathGiven = createCustomErrorClass("NoDBPathGiven");
export const DBWrongPassword = createCustomErrorClass("DBWrongPassword");
export const DBNotReset = createCustomErrorClass("DBNotReset");

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
    this.stack = new Error().stack;
    this.id = id;
  }
}

addCustomErrorDeserializer(
  "TransportError",
  (e) => new TransportError(e.message, e.id)
);

export const StatusCodes = {
  ACCESS_CONDITION_NOT_FULFILLED: 0x9804,
  ALGORITHM_NOT_SUPPORTED: 0x9484,
  CLA_NOT_SUPPORTED: 0x6e00,
  CODE_BLOCKED: 0x9840,
  CODE_NOT_INITIALIZED: 0x9802,
  COMMAND_INCOMPATIBLE_FILE_STRUCTURE: 0x6981,
  CONDITIONS_OF_USE_NOT_SATISFIED: 0x6985,
  CONTRADICTION_INVALIDATION: 0x9810,
  CONTRADICTION_SECRET_CODE_STATUS: 0x9808,
  CUSTOM_IMAGE_BOOTLOADER: 0x662f,
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
  }
  if (0x6f00 <= code && code <= 0x6fff) {
    return "Internal error, please report";
  }
}

/**
 * Error thrown when a device returned a non success status.
 * the error.statusCode is one of the `StatusCodes` exported by this library.
 */
export function TransportStatusError(statusCode: number): void {
  const statusText =
    Object.keys(StatusCodes).find((k) => StatusCodes[k] === statusCode) ||
    "UNKNOWN_ERROR";
  const smsg = getAltStatusMessage(statusCode) || statusText;
  const statusCodeStr = statusCode.toString(16);
  const message = `Ledger device: ${smsg} (0x${statusCodeStr})`;

  // Maps to a LockedDeviceError
  if (statusCode === StatusCodes.LOCKED_DEVICE) {
    throw new LockedDeviceError(message);
  }

  this.name = "TransportStatusError";
  this.message = message;
  this.stack = new Error().stack;
  this.statusCode = statusCode;
  this.statusText = statusText;
}
TransportStatusError.prototype = new Error();

addCustomErrorDeserializer(
  "TransportStatusError",
  (e) => new TransportStatusError(e.statusCode)
);
