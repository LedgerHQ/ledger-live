/**
 * Error messages matching any of these patterns will be dropped in Datadog beforeSend.
 * Ported from sentry/install.ts for parity. Supports string (includes) and RegExp.
 */

const API_ISSUES = [
  "<!DOCTYPE html",
  "HederaAddAccountError",
  "LedgerAPI4xx",
  "LedgerAPI5xx",
  "Service Unavailable",
  "Unexpected ''",
  "Unexpected '<'",
];

const BAD_USAGE_OF_DEVICE = [
  "BleError",
  "BluetoothRequired",
  "CantOpenDevice",
  "CeloAppPleaseEnableContractData",
  "could not read from HID device",
  "DeviceDisconnectedWhileSendingError",
  "DeviceOnDashboardExpected",
  "EthAppPleaseEnableContractData",
  "failed with status code",
  "FirmwareNotRecognized",
  "GetAppAndVersionUnsupportedFormat",
  "HwTransportError",
  "Invalid channel",
  "Ledger Device is busy",
  "Ledger device: UNKNOWN_ERROR",
  "LockedDeviceError",
  "ManagerDeviceLocked",
  "PairingFailed",
  "UnresponsiveDeviceError",
  "UserRefusedOnDevice",
  "VechainAppPleaseEnableContractDataAndMultiClause",
];

const NETWORKING_CONDITIONS = [
  "API HTTP",
  "DisconnectedError",
  "EACCES",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETDOWN",
  "ENETUNREACH",
  "ENOSPC",
  "ENOTFOUND",
  "EPERM",
  "ERR_CONNECTION_RESET",
  "ERR_INTERNET_DISCONNECTED",
  "ERR_NAME_NOT_RESOLVED",
  "ERR_NETWORK_CHANGED",
  "ERR_PROXY_CONNECTION_FAILED",
  "ERR_SSL_PROTOCOL_ERROR",
  "ETIMEDOUT",
  "Failed to fetch",
  "Failed to load",
  "getaddrinfo",
  "HttpError",
  "Network Error",
  "NetworkDown",
  "NetworkError",
  "NotConnectedError",
  "socket disconnected",
  "socket hang up",
  "status code 404",
  "unable to get local issuer certificate",
];

const TIMEOUTS = [
  "ERR_CONNECTION_TIMED_OUT",
  "ERR_TIMED_OUT",
  "request timed out",
  "SolanaTxConfirmationTimeout",
  "Time-out",
  "timeout",
  "TimeoutError",
  "TronTransactionExpired",
  "WebsocketConnectionError",
];

const OTHER = [
  "524 undefined",
  "530 undefined",
  "AccountAwaitingSendPendingOperations",
  "AccountNeedResync",
  "Bad status on response: 503",
  "Cannot update while running on a read-only volume",
  "DeviceAppVerifyNotSupported",
  "failed to find a healthy working node",
  "InvalidAddressError",
  "Memory Warning",
  "Missing or invalid topic field",
  "Please reimport your Tezos accounts",
  "Received an invalid JSON-RPC message",
  "Render frame was disposed before WebFrameMain could be accessed",
  "SwapNoAvailableProviders",
  "Transaction simulation failed",
  "TransactionRefusedOnDevice",
  "was reached for request with last error",
];

export const IGNORE_ERROR_MESSAGES: (string | RegExp)[] = [
  ...API_ISSUES,
  ...BAD_USAGE_OF_DEVICE,
  ...NETWORKING_CONDITIONS,
  ...TIMEOUTS,
  ...OTHER,
];

export function shouldIgnoreErrorMessage(message: string): boolean {
  return IGNORE_ERROR_MESSAGES.some(pattern => {
    if (typeof pattern === "string") {
      return message.includes(pattern);
    }
    return pattern.test(message);
  });
}
