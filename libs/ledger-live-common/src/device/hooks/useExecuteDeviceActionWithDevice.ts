import { useState, useEffect } from "react";
import {
  DeviceAction,
  DeviceActionState,
  DeviceActionIntermediateValue,
  DmkError,
} from "@ledgerhq/device-management-kit";
import { of } from "rxjs";
import {
  useExecuteDMKDeviceAction,
  isDmkTransport,
  type UseExecuteDMKDeviceActionParams,
  type UseExecuteDMKDeviceActionOutput,
} from "@ledgerhq/live-dmk-shared";
import { withDevice } from "../../hw/deviceAccess";
import Transport from "@ledgerhq/hw-transport";

type Params<
  DAInput,
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
> = {
  deviceId: string;
  deviceAction: DeviceAction<DAOutput, DAInput, DAError, DAIntermediateValue>;
  enabled: boolean;
};

type Output<
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
> = {
  state: DeviceActionState<DAOutput, DAError, DAIntermediateValue> | null;
  error: unknown | null;
  restart: () => void;
};

export function useExecuteDeviceActionWithDevice<
  DAInput,
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
>(
  params: Params<DAInput, DAOutput, DAError, DAIntermediateValue>,
): Output<DAOutput, DAError, DAIntermediateValue> {
  const [transport, setTransport] = useState<Transport | null>(null);

  useEffect(() => {
    withDevice(params.deviceId)(transport => {
      setTransport(transport);
      return of(true);
    });
  }, [params.deviceId]);

  const hookParams: UseExecuteDMKDeviceActionParams<
    DAInput,
    DAOutput,
    DAError,
    DAIntermediateValue
  > =
    transport && isDmkTransport(transport)
      ? {
          dmk: transport.dmk,
          sessionId: transport.sessionId,
          deviceAction: params.deviceAction,
          enabled: params.enabled,
        }
      : {
          enabled: false,
        };

  const { state, error, restart } = useExecuteDMKDeviceAction(hookParams);
  return {
    state,
    error,
    restart,
  };
}
