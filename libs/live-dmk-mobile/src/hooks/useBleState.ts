import { useEffect, useState } from "react";
import { State as BlePlxState } from "react-native-ble-plx";
import { BlePlxManager } from "../transport/BlePlxManager";

export enum BleState {
  Unknown = "Unknown",
  Resetting = "Resetting",
  Unsupported = "Unsupported",
  Unauthorized = "Unauthorized",
  PoweredOff = "PoweredOff",
  PoweredOn = "PoweredOn",
}

/**
 * Those states are undetermined, normally, RN BLE PLX quickly emits an update after going to these states.
 * But in some cases, it doesn't, so we need to request the current state to know the actual state.
 */
export const UndeterminedBleStates = [BleState.Unknown, BleState.Resetting];

type ObserveStateFn = (listener: (state: BleState) => void) => { remove: () => void };
type RequestCurrentStateFn = () => Promise<BleState>;

const mapBlePlxStateToBleState = (state: BlePlxState): BleState => {
  switch (state) {
    case BlePlxState.Unknown:
      return BleState.Unknown;
    case BlePlxState.Resetting:
      return BleState.Resetting;
    case BlePlxState.Unsupported:
      return BleState.Unsupported;
    case BlePlxState.Unauthorized:
      return BleState.Unauthorized;
    case BlePlxState.PoweredOff:
      return BleState.PoweredOff;
    case BlePlxState.PoweredOn:
      return BleState.PoweredOn;
  }
};

function blePlxObserveBleState(observer: (state: BleState) => void) {
  return BlePlxManager.instance.onStateChange((state: BlePlxState) => {
    observer(mapBlePlxStateToBleState(state));
  }, true);
}

function blePlxRequestCurrentState(): Promise<BleState> {
  return BlePlxManager.instance.state().then(mapBlePlxStateToBleState);
}

export function useBleState(
  enabled = true,
  /** Injected for testing purposes */
  observeStateFn: ObserveStateFn = blePlxObserveBleState,
  /** Injected for testing purposes */
  requestCurrentStateFn: RequestCurrentStateFn = blePlxRequestCurrentState,
): BleState {
  const [observedTransportState, setObservedTransportState] = useState<BleState>(BleState.Unknown);

  useEffect(() => {
    if (!enabled) return;
    let dead = false;
    const subscription = observeStateFn((state: BleState) => {
      if (dead) return;
      setObservedTransportState(state);

      /*
       * If the state is unknown or resetting, we need to request the current state as a bug in RN BLE PLX sometimes
       * never sends an update after a state change.
       */
      if (UndeterminedBleStates.includes(state)) {
        requestCurrentStateFn().then(s => {
          if (dead) return;
          // As this is async, only update if the current state is still undetermined, to avoid a race condition.
          setObservedTransportState(savedState =>
            UndeterminedBleStates.includes(savedState) ? s : savedState,
          );
        });
      }
    });
    return () => {
      dead = true;
      subscription.remove();
    };
  }, [enabled, observeStateFn, requestCurrentStateFn]);

  return observedTransportState;
}
