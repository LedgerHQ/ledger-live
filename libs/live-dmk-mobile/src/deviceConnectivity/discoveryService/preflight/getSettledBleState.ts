import { State as BlePlxState } from "react-native-ble-plx";

/** The adapter reports these states while it starts or while it turns on or off. */
const UNDETERMINED_STATES = new Set<BlePlxState>([BlePlxState.Unknown, BlePlxState.Resetting]);

export const SETTLED_BLE_STATE_POLL_INTERVAL_MS = 250;
export const SETTLED_BLE_STATE_TIMEOUT_MS = 3_000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Reads the Bluetooth state until it is no longer `Unknown` or `Resetting`, so that a preflight
 * check does not report an adapter that is turning on or off. After the timeout, returns the last
 * state read.
 *
 * Polls instead of listening to state changes: react-native-ble-plx sometimes does not emit the
 * state that follows `Unknown` or `Resetting`.
 */
export const getSettledBleState = async (
  getState: () => Promise<BlePlxState>,
): Promise<BlePlxState> => {
  const deadline = Date.now() + SETTLED_BLE_STATE_TIMEOUT_MS;
  let state = await getState();

  while (UNDETERMINED_STATES.has(state) && Date.now() < deadline) {
    await wait(SETTLED_BLE_STATE_POLL_INTERVAL_MS);
    state = await getState();
  }

  return state;
};
