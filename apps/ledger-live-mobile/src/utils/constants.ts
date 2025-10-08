import Config from "react-native-config";

export const SYNC_DELAY = 2500;
export const DETOX_ENABLED = Config.DETOX === "1" || Config.DETOX === "true";
export const BLE_SCANNING_NOTHING_TIMEOUT = (DETOX_ENABLED ? 60 : 30) * 1000;
export const GENUINE_CHECK_TIMEOUT = 120 * 1000;
export const VIBRATION_PATTERN_ERROR = [0, 150];
export const LEDGER_APPLE_WARNING_EXPLAINER_LINK =
  "https://support.ledger.com/hc/article/12309873917853-zd?docs=true";
export const PTX_SERVICES_TOAST_ID = "PTX_SERVICES_TOAST_ID";

// --- Exclusion lists for Datadog (Sentry FF on) ---
// Exclude errors related to user environment or conditions not fixable by us
export const EXCLUDED_LOGS_ERROR_NAME = [
  // networking conditions
  "DisconnectedError",
  "Network Error",
  "NetworkDown",
  "NotConnectedError",
  // timeouts
  "TimeoutError",
  "WebsocketConnectionError",
  "TronTransactionExpired", // user waits too long on device, possibly network slowness too
  "SolanaTxConfirmationTimeout",
  // bad usage of device
  "BleError",
  "EthAppPleaseEnableContractData",
  "VechainAppPleaseEnableContractDataAndMultiClause",
  "CantOpenDevice",
  "DeviceOnDashboardExpected",
  "PairingFailed",
  "GetAppAndVersionUnsupportedFormat",
  "BluetoothRequired",
  "ManagerDeviceLocked",
  "LockedDeviceError",
  "UnresponsiveDeviceError",
  // wrong My Ledger provider selected for the firmware of the connected device
  "FirmwareNotRecognized",
  // errors coming from the usage of a Transport implementation
  "HwTransportError",
  // other
  "InvalidAddressError",
  "SwapNoAvailableProviders",
  "AccountNeedResync",
  "DeviceAppVerifyNotSupported",
  "AccountAwaitingSendPendingOperations",
  "HederaAddAccountError",
  // API issues
  "LedgerAPI4xx",
  "LedgerAPI5xx",
];

export const EXCLUDED_ERROR_DESCRIPTION = [
  // networking
  /timeout of .* exceeded/,
  "timeout exceeded",
  "Network Error",
  "Network request failed",
  "INVALID_STATE_ERR",
  "API HTTP",
  "Unexpected ''",
  "Unexpected '<'",
  "Service Unvailable",
  // base usage of device
  "Invalid channel",
  /Ledger Device is busy/,
  "Ledger device: UNKNOWN_ERROR",
  // others
  "Transaction signing request was rejected by the user",
  "Transaction approval request was rejected",
  /Please reimport your .* accounts/,
  "database or disk is full",
  "Unable to open URL",
  "Received an invalid JSON-RPC message",
  // LIVE-3506 workaround, solana throws tons of cryptic errors
  "failed to find a healthy working node",
  "was reached for request with last error",
  "Transaction simulation failed",
  "530 undefined",
  "524 undefined",
  "Missing or invalid topic field", // wallet connect issue
  "Bad status on response: 503", // cryptoorg node
];

export const FIRST_PARTY_MAIN_HOST_DOMAIN = "ledger.com";
export const PORTFOLIO_VIEW_ID = "Portfolio";
export const MARKET_LIST_VIEW_ID = "MarketList";
export const TOP_CHAINS = ["bitcoin", "ethereum", "solana", "xrp", "cardano"];
