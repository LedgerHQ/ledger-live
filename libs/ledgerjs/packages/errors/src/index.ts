import {
  serializeError,
  deserializeError,
  createCustomErrorClass,
  addCustomErrorDeserializer,
  LedgerErrorConstructor,
} from "./helpers";

export { serializeError, deserializeError, createCustomErrorClass, addCustomErrorDeserializer };

export const AccountNameRequiredError = createCustomErrorClass("AccountNameRequired");
export const AccountNotSupported = createCustomErrorClass("AccountNotSupported");
export const AmountRequired = createCustomErrorClass("AmountRequired");
export const BluetoothRequired = createCustomErrorClass("BluetoothRequired");
export const BtcUnmatchedApp = createCustomErrorClass("BtcUnmatchedApp");
export const CantOpenDevice = createCustomErrorClass("CantOpenDevice");
export const CashAddrNotSupported = createCustomErrorClass("CashAddrNotSupported");
export const ClaimRewardsFeesWarning = createCustomErrorClass("ClaimRewardsFeesWarning");
export const CurrencyNotSupported = createCustomErrorClass<
  { currencyName: string },
  LedgerErrorConstructor<{ currencyName: string }>
>("CurrencyNotSupported");
export const DeviceAppVerifyNotSupported = createCustomErrorClass("DeviceAppVerifyNotSupported");
export const DeviceGenuineSocketEarlyClose = createCustomErrorClass(
  "DeviceGenuineSocketEarlyClose",
);
export const DeviceNotGenuineError = createCustomErrorClass("DeviceNotGenuine");
export const DeviceOnDashboardExpected = createCustomErrorClass("DeviceOnDashboardExpected");
export const DeviceOnDashboardUnexpected = createCustomErrorClass("DeviceOnDashboardUnexpected");
export const DeviceInOSUExpected = createCustomErrorClass("DeviceInOSUExpected");
export const DeviceHalted = createCustomErrorClass("DeviceHalted");
export const DeviceNameInvalid = createCustomErrorClass("DeviceNameInvalid");
export const DeviceSocketFail = createCustomErrorClass("DeviceSocketFail");
export const DeviceSocketNoBulkStatus = createCustomErrorClass("DeviceSocketNoBulkStatus");
export const DeviceNeedsRestart = createCustomErrorClass("DeviceSocketNoBulkStatus");
export const UnresponsiveDeviceError = createCustomErrorClass("UnresponsiveDeviceError");
export const DisconnectedDevice = createCustomErrorClass("DisconnectedDevice");
export const DisconnectedDeviceDuringOperation = createCustomErrorClass(
  "DisconnectedDeviceDuringOperation",
);
export const DeviceExtractOnboardingStateError = createCustomErrorClass(
  "DeviceExtractOnboardingStateError",
);
export const DeviceOnboardingStatePollingError = createCustomErrorClass(
  "DeviceOnboardingStatePollingError",
);
export const EnpointConfigError = createCustomErrorClass("EnpointConfig");
export const EthAppPleaseEnableContractData = createCustomErrorClass(
  "EthAppPleaseEnableContractData",
);
export const FeeEstimationFailed = createCustomErrorClass("FeeEstimationFailed");
export const FirmwareNotRecognized = createCustomErrorClass("FirmwareNotRecognized");
export const HardResetFail = createCustomErrorClass("HardResetFail");
export const InvalidXRPTag = createCustomErrorClass("InvalidXRPTag");
export const InvalidAddress = createCustomErrorClass("InvalidAddress");
export const InvalidNonce = createCustomErrorClass("InvalidNonce");
export const InvalidAddressBecauseDestinationIsAlsoSource = createCustomErrorClass(
  "InvalidAddressBecauseDestinationIsAlsoSource",
);
export const LatestMCUInstalledError = createCustomErrorClass("LatestMCUInstalledError");
export const UnknownMCU = createCustomErrorClass("UnknownMCU");
export const LedgerAPIError = createCustomErrorClass("LedgerAPIError");
export const LedgerAPIErrorWithMessage = createCustomErrorClass("LedgerAPIErrorWithMessage");
export const LedgerAPINotAvailable = createCustomErrorClass("LedgerAPINotAvailable");
export const ManagerAppAlreadyInstalledError = createCustomErrorClass("ManagerAppAlreadyInstalled");
export const ManagerAppRelyOnBTCError = createCustomErrorClass("ManagerAppRelyOnBTC");
export const ManagerAppDepInstallRequired = createCustomErrorClass("ManagerAppDepInstallRequired");
export const ManagerAppDepUninstallRequired = createCustomErrorClass(
  "ManagerAppDepUninstallRequired",
);
export const ManagerDeviceLockedError = createCustomErrorClass("ManagerDeviceLocked");
export const ManagerFirmwareNotEnoughSpaceError = createCustomErrorClass(
  "ManagerFirmwareNotEnoughSpace",
);
export const ManagerNotEnoughSpaceError = createCustomErrorClass("ManagerNotEnoughSpace");
export const ManagerUninstallBTCDep = createCustomErrorClass("ManagerUninstallBTCDep");
export const NetworkDown = createCustomErrorClass("NetworkDown");
export const NetworkError = createCustomErrorClass("NetworkError");
export const NoAddressesFound = createCustomErrorClass("NoAddressesFound");
export const NotEnoughBalance = createCustomErrorClass("NotEnoughBalance");
export const NotEnoughBalanceToDelegate = createCustomErrorClass("NotEnoughBalanceToDelegate");
export const NotEnoughBalanceInParentAccount = createCustomErrorClass(
  "NotEnoughBalanceInParentAccount",
);
export const NotEnoughSpendableBalance = createCustomErrorClass("NotEnoughSpendableBalance");
export const NotEnoughBalanceBecauseDestinationNotCreated = createCustomErrorClass(
  "NotEnoughBalanceBecauseDestinationNotCreated",
);
export const NoAccessToCamera = createCustomErrorClass("NoAccessToCamera");
export const NotEnoughGas = createCustomErrorClass("NotEnoughGas");
// Error message specifically for the PTX swap flow
export const NotEnoughGasSwap = createCustomErrorClass("NotEnoughGasSwap");
export const NotSupportedLegacyAddress = createCustomErrorClass("NotSupportedLegacyAddress");
export const GasLessThanEstimate = createCustomErrorClass("GasLessThanEstimate");
export const PriorityFeeTooLow = createCustomErrorClass("PriorityFeeTooLow");
export const PriorityFeeTooHigh = createCustomErrorClass("PriorityFeeTooHigh");
export const PriorityFeeHigherThanMaxFee = createCustomErrorClass("PriorityFeeHigherThanMaxFee");
export const MaxFeeTooLow = createCustomErrorClass("MaxFeeTooLow");
export const PasswordsDontMatchError = createCustomErrorClass("PasswordsDontMatch");
export const PasswordIncorrectError = createCustomErrorClass("PasswordIncorrect");
export const RecommendSubAccountsToEmpty = createCustomErrorClass("RecommendSubAccountsToEmpty");
export const RecommendUndelegation = createCustomErrorClass("RecommendUndelegation");
export const TimeoutTagged = createCustomErrorClass("TimeoutTagged");
export const UnexpectedBootloader = createCustomErrorClass("UnexpectedBootloader");
export const MCUNotGenuineToDashboard = createCustomErrorClass("MCUNotGenuineToDashboard");
export const RecipientRequired = createCustomErrorClass("RecipientRequired");
export const UnavailableTezosOriginatedAccountReceive = createCustomErrorClass(
  "UnavailableTezosOriginatedAccountReceive",
);
export const UnavailableTezosOriginatedAccountSend = createCustomErrorClass(
  "UnavailableTezosOriginatedAccountSend",
);
export const UpdateFetchFileFail = createCustomErrorClass("UpdateFetchFileFail");
export const UpdateIncorrectHash = createCustomErrorClass("UpdateIncorrectHash");
export const UpdateIncorrectSig = createCustomErrorClass("UpdateIncorrectSig");
export const UpdateYourApp = createCustomErrorClass("UpdateYourApp");
export const UserRefusedDeviceNameChange = createCustomErrorClass("UserRefusedDeviceNameChange");
export const UserRefusedAddress = createCustomErrorClass("UserRefusedAddress");
export const UserRefusedFirmwareUpdate = createCustomErrorClass("UserRefusedFirmwareUpdate");
export const UserRefusedAllowManager = createCustomErrorClass("UserRefusedAllowManager");
export const UserRefusedOnDevice = createCustomErrorClass("UserRefusedOnDevice"); // TODO rename because it's just for transaction refusal
export const ExpertModeRequired = createCustomErrorClass("ExpertModeRequired");
export const TransportOpenUserCancelled = createCustomErrorClass("TransportOpenUserCancelled");
export const TransportInterfaceNotAvailable = createCustomErrorClass(
  "TransportInterfaceNotAvailable",
);
export const TransportPendingOperation = createCustomErrorClass("TransportPendingOperation");
export const TransportWebUSBGestureRequired = createCustomErrorClass(
  "TransportWebUSBGestureRequired",
);
export const TransactionHasBeenValidatedError = createCustomErrorClass(
  "TransactionHasBeenValidatedError",
);
export const TransportExchangeTimeoutError = createCustomErrorClass(
  "TransportExchangeTimeoutError",
);
export const DeviceShouldStayInApp = createCustomErrorClass("DeviceShouldStayInApp");
export const WebsocketConnectionError = createCustomErrorClass("WebsocketConnectionError");
export const WebsocketConnectionFailed = createCustomErrorClass("WebsocketConnectionFailed");
export const WrongDeviceForAccount = createCustomErrorClass("WrongDeviceForAccount");
export const WrongDeviceForAccountPayout = createCustomErrorClass("WrongDeviceForAccountPayout");
export const WrongDeviceForAccountRefund = createCustomErrorClass("WrongDeviceForAccountRefund");
export const WrongAppForCurrency = createCustomErrorClass("WrongAppForCurrency");

export const ETHAddressNonEIP = createCustomErrorClass("ETHAddressNonEIP");
export const CantScanQRCode = createCustomErrorClass("CantScanQRCode");
export const FeeNotLoaded = createCustomErrorClass("FeeNotLoaded");
export const FeeNotLoadedSwap = createCustomErrorClass("FeeNotLoadedSwap");
export const FeeRequired = createCustomErrorClass("FeeRequired");
export const FeeTooHigh = createCustomErrorClass("FeeTooHigh");
export const PendingOperation = createCustomErrorClass("PendingOperation");
export const SyncError = createCustomErrorClass("SyncError");
export const PairingFailed = createCustomErrorClass("PairingFailed");
export const PeerRemovedPairing = createCustomErrorClass("PeerRemovedPairing");
export const GenuineCheckFailed = createCustomErrorClass("GenuineCheckFailed");
export const LedgerAPI4xx = createCustomErrorClass("LedgerAPI4xx");
export const LedgerAPI5xx = createCustomErrorClass("LedgerAPI5xx");
export const FirmwareOrAppUpdateRequired = createCustomErrorClass("FirmwareOrAppUpdateRequired");

// SpeedUp / Cancel EVM tx
export const ReplacementTransactionUnderpriced = createCustomErrorClass(
  "ReplacementTransactionUnderpriced",
);

// Bitcoin family
export const OpReturnDataSizeLimit = createCustomErrorClass("OpReturnSizeLimit");
export const DustLimit = createCustomErrorClass("DustLimit");

// Language
export const LanguageNotFound = createCustomErrorClass("LanguageNotFound");

// db stuff, no need to translate
export const NoDBPathGiven = createCustomErrorClass("NoDBPathGiven");
export const DBWrongPassword = createCustomErrorClass("DBWrongPassword");
export const DBNotReset = createCustomErrorClass("DBNotReset");

export const SequenceNumberError = createCustomErrorClass("SequenceNumberError");
export const DisabledTransactionBroadcastError = createCustomErrorClass(
  "DisabledTransactionBroadcastError",
);

// Represents the type of all the classes created with createCustomErrorClass
export type CustomErrorClassType = ReturnType<typeof createCustomErrorClass>;

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

// Represents the type of the class TransportStatusError and its children
export type TransportStatusErrorClassType = typeof TransportStatusError | typeof LockedDeviceError;

addCustomErrorDeserializer("TransportStatusError", e => new TransportStatusError(e.statusCode));
