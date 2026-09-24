export const POLL_INTERVAL_MS = 1_000;
/**
 * Must outlast the transport reconnection window, since the session only reports
 * `NOT_CONNECTED` once that window closes: 15s on Android BLE, 10s on iOS BLE.
 */
export const SESSION_SETTLE_TIMEOUT_MS = 20_000;
/** Bounds a disconnection the transport may never confirm. */
export const SESSION_TEARDOWN_TIMEOUT_MS = 10_000;
/**
 * Bounds the calls of the reconnection loop. Connecting and sending a command both go through the
 * link the transport hands back, and neither reports anything when that link is already dead, so
 * they can stay pending forever. A device that answers never takes this long.
 */
export const DEVICE_CALL_TIMEOUT_MS = 10_000;
