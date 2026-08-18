/** RTK Query reducer path for the Push Devices Service — stable; it keys the store slice. */
export const PUSH_DEVICES_REDUCER_PATH = "pushDevicesApi";

/** Max retries for transient Push Devices request failures. */
export const MAX_RETRIES = 3;

/** Request header carrying the Ledger client version on every Push Devices request. */
export const HEADER_X_LEDGER_CLIENT_VERSION = "X-Ledger-Client-Version";
