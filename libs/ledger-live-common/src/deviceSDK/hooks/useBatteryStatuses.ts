import { useCallback, useEffect, useState } from "react";
import {
  getBatteryStatusesAction,
  GetBatteryStatusesActionState,
  initialState,
} from "../actions/getBatteryStatuses";
import { BatteryStatusTypes } from "../../hw/getBatteryStatus";
import { log } from "@ledgerhq/logs";

export type UseBateryStatusesArgs = {
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
}: UseBateryStatusesArgs): {
  batteryStatusesState: GetBatteryStatusesActionState;
  requestCompleted: boolean;
  triggerRequest: () => void;
  cancelRequest: () => void;
} => {
  const [batteryStatusesState, setBatteryStatusesState] =
    useState<GetBatteryStatusesActionState>(initialState);
  const [requestCompleted, setRequestCompleted] = useState<boolean>(false);
  const [nonce, setNonce] = useState(0);
  const [cancelRequest, setCancelRequest] = useState<() => void>(() => {});

  useEffect(() => {
    if (nonce > 0 && deviceId) {
      const sub = getBatteryStatusesAction({
        deviceId,
        statuses,
      }).subscribe({
        next: state => setBatteryStatusesState(state),
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
  }, [deviceId, statuses, nonce]);

  const triggerRequest = useCallback(() => {
    setRequestCompleted(false);
    setBatteryStatusesState(initialState);
    setNonce(nonce => nonce + 1);
  }, []);

  return {
    batteryStatusesState,
    triggerRequest,
    requestCompleted,
    cancelRequest,
  };
};
