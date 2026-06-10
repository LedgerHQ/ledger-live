/** Ledger BLE 0x08 GET-MTU request frame (mirrors @ledgerhq/hw-transport-node-ble). */
export const BLE_MTU_REQUEST_FRAME: readonly number[] = [0x08, 0, 0, 0, 0];

/** First byte of the GET-MTU response notification. */
export const BLE_MTU_RESPONSE_HEADER_TAG = 0x08;

/** Bound on the MTU negotiation right after subscribing to notifications. */
export const BLE_MTU_HANDSHAKE_TIMEOUT_MS = 10_000;

/** Conservative BLE payload size when MTU negotiation reports the 23-byte floor. */
export const DEFAULT_BLE_FRAME_SIZE = 20;
