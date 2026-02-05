import {
  DeviceAction,
  DeviceActionIntermediateValue,
  DeviceManagementKit,
  DiscoveredDevice,
  DmkError,
} from "@ledgerhq/device-management-kit";
import { useExecuteDMKDeviceAction, type Output } from "./useExecuteDeviceAction";
import { useConnectDiscoveredDevice } from "./useConnectDiscoveredDevice";

export type Params<
  DAInput,
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
> =
  | {
      dmk: DeviceManagementKit;
      discoveredDevice: DiscoveredDevice;
      deviceAction: DeviceAction<DAOutput, DAInput, DAError, DAIntermediateValue>;
      enabled: boolean;
    }
  | {
      enabled: false;
    };

export function useExecuteDeviceActionWithDiscoveredDevice<
  DAInput,
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
>(
  params: Params<DAInput, DAOutput, DAError, DAIntermediateValue>,
): Output<DAOutput, DAError, DAIntermediateValue> {
  const connectParams = params.enabled
    ? {
        dmk: params.dmk,
        discoveredDevice: params.discoveredDevice,
        enabled: true as const,
      }
    : { enabled: false as const };

  const {
    sessionId,
    error: connectError,
    retry: retryConnection,
  } = useConnectDiscoveredDevice(connectParams);

  const hookParams =
    params.enabled && sessionId
      ? {
          dmk: params.dmk,
          sessionId,
          deviceAction: params.deviceAction,
          enabled: true as const,
        }
      : {
          enabled: false as const,
        };

  const { state, error, restart } = useExecuteDMKDeviceAction(hookParams);

  return {
    state,
    error: connectError ?? error,
    restart: connectError ? retryConnection : restart,
  };
}
