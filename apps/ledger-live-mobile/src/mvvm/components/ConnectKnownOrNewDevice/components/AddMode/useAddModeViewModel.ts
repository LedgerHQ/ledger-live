import { useConnectNewDeviceTracking } from "LLM/components/ConnectNewDevice";
import { useIsNewDevice } from "LLM/components/DeviceConnection";
import type { AddModeProps, AddModeViewProps } from "./types";

export function useAddModeViewModel(props: AddModeProps): AddModeViewProps {
  // The device list sends the outcome of the Add mode.
  useConnectNewDeviceTracking(props.state, { reportsOutcome: false });
  const checkIsNewDevice = useIsNewDevice();

  return { ...props, checkIsNewDevice };
}
