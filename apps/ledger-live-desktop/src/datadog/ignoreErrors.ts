/**
 * Error messages matching any of these patterns will be dropped in Datadog beforeSend.
 * Ported from sentry/install.ts for parity. Supports string (includes) and RegExp.
 */
export const IGNORE_ERROR_MESSAGES: (string | RegExp)[] = [
  // networking conditions
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
  "ERR_PROXY_CONNECTION_FAILED",
  "ERR_NAME_NOT_RESOLVED",
  "ERR_INTERNET_DISCONNECTED",
  "ERR_NETWORK_CHANGED",
  "ETIMEDOUT",
  "getaddrinfo",
  "HttpError",
  "Network Error",
  "NetworkDown",
  "NetworkError",
  "NotConnectedError",
  "socket disconnected",
  "socket hang up",
  "ERR_SSL_PROTOCOL_ERROR",
  "status code 404",
  "unable to get local issuer certificate",
  "Failed to fetch",
  "Failed to load",
  // API issues
  "LedgerAPI4xx",
  "LedgerAPI5xx",
  "<!DOCTYPE html",
  "Unexpected ''",
  "Unexpected '<'",
  "Service Unavailable",
  "HederaAddAccountError",
  // timeouts
  "ERR_CONNECTION_TIMED_OUT",
  "request timed out",
  "SolanaTxConfirmationTimeout",
  "timeout",
  "TimeoutError",
  "Time-out",
  "TronTransactionExpired",
  "WebsocketConnectionError",
  // bad usage of device
  "BleError",
  "BluetoothRequired",
  "CantOpenDevice",
  "could not read from HID device",
  "DeviceOnDashboardExpected",
  "EthAppPleaseEnableContractData",
  "CeloAppPleaseEnableContractData",
  "VechainAppPleaseEnableContractDataAndMultiClause",
  "failed with status code",
  "GetAppAndVersionUnsupportedFormat",
  "Invalid channel",
  "Ledger Device is busy",
  "DeviceDisconnectedWhileSendingError",
  "ManagerDeviceLocked",
  "LockedDeviceError",
  "UnresponsiveDeviceError",
  "PairingFailed",
  "Ledger device: UNKNOWN_ERROR",
  "UserRefusedOnDevice",
  "FirmwareNotRecognized",
  "HwTransportError",
  // other
  "AccountAwaitingSendPendingOperations",
  "AccountNeedResync",
  "Cannot update while running on a read-only volume",
  "DeviceAppVerifyNotSupported",
  "InvalidAddressError",
  "Received an invalid JSON-RPC message",
  "SwapNoAvailableProviders",
  "TransactionRefusedOnDevice",
  "Please reimport your Tezos accounts",
  "Transaction simulation failed",
  "failed to find a healthy working node",
  "was reached for request with last error",
  "530 undefined",
  "524 undefined",
  "Missing or invalid topic field",
  "Bad status on response: 503",
  "Render frame was disposed before WebFrameMain could be accessed",
];

export function shouldIgnoreErrorMessage(message: string): boolean {
  return IGNORE_ERROR_MESSAGES.some(pattern => {
    if (typeof pattern === "string") {
      return message.includes(pattern);
    }
    return pattern.test(message);
  });
}
