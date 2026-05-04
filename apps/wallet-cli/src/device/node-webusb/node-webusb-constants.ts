/** DMK USB framing (same as @ledgerhq/device-transport-kit-node-hid). */
export const FRAME_SIZE = 64;

/** Device reconnect window for DMK state machine (matches node-hid kit). */
export const RECONNECT_DEVICE_TIMEOUT_MS = 6000;

/** Windows hotplug can miss late WebUSB attach notifications; rescan periodically as a fallback. */
export const WINDOWS_WEBUSB_DISCOVERY_POLL_INTERVAL_MS = 1000;

/** Ledger WebUSB configuration (see @ledgerhq/hw-transport-webusb). */
export const LEDGER_WEBUSB_CONFIGURATION_VALUE = 1;

/** Bulk endpoint used by Ledger WebUSB transport. */
export const LEDGER_WEBUSB_ENDPOINT_NUMBER = 3;
