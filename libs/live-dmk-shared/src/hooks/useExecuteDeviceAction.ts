import { useCallback, useEffect, useState } from "react";
import {
  DeviceAction,
  DeviceActionIntermediateValue,
  DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKit,
  DmkError,
} from "@ledgerhq/device-management-kit";

export type Params<
  DAInput,
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
> =
  | {
      dmk: DeviceManagementKit;
      sessionId: string;
      deviceAction: DeviceAction<DAOutput, DAInput, DAError, DAIntermediateValue>;
      enabled: boolean;
    }
  | {
      enabled: false;
    };

export type Output<
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
> = {
  state: DeviceActionState<DAOutput, DAError, DAIntermediateValue> | null;
  error: unknown | null;
  restart: () => void;
};

export function useExecuteDMKDeviceAction<
  DAInput,
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
>(
  params: Params<DAInput, DAOutput, DAError, DAIntermediateValue>,
): Output<DAOutput, DAError, DAIntermediateValue> {
  const [daState, setDaState] =
    useState <
    DeviceActionState<DAOutput, DAError, DAIntermediateValue>({
      status: DeviceActionStatus.NotStarted,
    });
  const [error, setError] = useState<unknown | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!params.enabled) return;
    let dead = false;
    const { observable, cancel } = params.dmk.executeDeviceAction({
      sessionId: params.sessionId,
      deviceAction: params.deviceAction,
    });
    observable.subscribe({
      next: state => {
        if (dead) return;
        setDaState(state);
      },
      error: error => {
        if (dead) return;
        setError(error);
      },
    });
    return () => {
      dead = true;
      cancel();
    };
  }, [params.enabled]);

  const restart = useCallback(() => {
    setNonce(nonce + 1);
  }, [nonce]);

  return {
    state: daState,
    error,
    restart,
  };
}
