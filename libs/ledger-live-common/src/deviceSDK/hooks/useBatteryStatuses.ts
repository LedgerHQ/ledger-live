import { useCallback, useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import { BatteryStatusFlags } from "@ledgerhq/types-devices";
import {
  getBatteryStatusesAction,
  GetBatteryStatusesActionState,
  initialState,
} from "../actions/getBatteryStatuses";
import { BatteryStatusTypes } from "../../hw/getBatteryStatus";
import { useEnv } from "../../env.react";

export type UseBatteryStatusesArgs = {
  deviceId?: string;
  statuses: BatteryStatusTypes[];
};

/**
 * Hook used to query one or multiple battery statuses for Ledger Stax. The state will contain an array of with all the
 * requested statuses in corresponding order.
 *
 * @param deviceId
 * @param statuses A list of status types to query
 *
 * @returns An object containing:
 * - the current state of the request
 * - a boolean that informs if the request is complete
 * - a function to trigger an retrigger the device action
 */
export const useBatteryStatuses = ({
  deviceId,
  statuses,
}: UseBatteryStatusesArgs): {
  batteryStatusesState: GetBatteryStatusesActionState;
  requestCompleted: boolean;
  triggerRequest: () => void;
  cancelRequest: () => void;
  isBatteryLow: boolean;
  lowBatteryPercentage: number;
} => {
  const [batteryStatusesState, setBatteryStatusesState] =
    useState<GetBatteryStatusesActionState>(initialState);
  const [requestCompleted, setRequestCompleted] = useState<boolean>(false);
  const [nonce, setNonce] = useState(0);

  // when passing a function to useState, the function is used as an initializer,
  // i.e its return value will be the initial state value,
  // cf. https://react.dev/reference/react/useState#parameters
  const [cancelRequest, setCancelRequest] = useState(() => () => {});
  const [isBatteryLow, setIsBatteryLow] = useState<boolean>(false);
  const lowBatteryPercentage = useEnv("LOW_BATTERY_PERCENTAGE");

  useEffect(() => {
    if (nonce > 0 && deviceId) {
      const sub = getBatteryStatusesAction({
        deviceId,
        statuses,
      }).subscribe({
        next: state => {
          if (state.error?.type === "UnknownApdu") {
            setBatteryStatusesState({ ...state, error: null });
          } else {
            setBatteryStatusesState(state);
          }

          // no battery status flags available
          if (state.batteryStatuses.length <= 1) return;

          const [percentage, statusFlags] = state.batteryStatuses as [number, BatteryStatusFlags];

          if (percentage < lowBatteryPercentage && statusFlags.charging === 0) {
            setIsBatteryLow(true);
          }
        },
        complete: () => {
          setRequestCompleted(true);
        },
        error: err => log("error", "error while retrieving the battery statuses", err),
      });

      setCancelRequest(() => () => {
        sub.unsubscribe();
        setRequestCompleted(false);
        setBatteryStatusesState(initialState);
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, [deviceId, lowBatteryPercentage, statuses, nonce]);

  const triggerRequest = useCallback(() => {
    setRequestCompleted(false);
    setIsBatteryLow(false);
    setBatteryStatusesState(initialState);
    setNonce(nonce => nonce + 1);
  }, []);

  return {
    batteryStatusesState,
    triggerRequest,
    requestCompleted,
    cancelRequest,
    isBatteryLow,
    lowBatteryPercentage,
  };
};
