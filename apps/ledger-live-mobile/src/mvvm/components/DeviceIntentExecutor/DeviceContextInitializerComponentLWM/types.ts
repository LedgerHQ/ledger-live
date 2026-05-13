import type { EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { SupportedDeviceActionModelId } from "LLM/components/DeviceActionContent";

export type InitializerDevice = Readonly<{
  id: string;
  modelId: DeviceModelId;
  supportedModelId: SupportedDeviceActionModelId;
  name: string;
  productName: string;
  wired: boolean;
}>;

export type DeviceContextInitializerComponentLWMViewProps = Readonly<{
  state: EnsureAppReadyState;
  device: InitializerDevice;
  onCancel: () => void;
}>;

export type BaseInitializerStateProps<State extends EnsureAppReadyState> = Readonly<{
  state: State;
  device: InitializerDevice;
  onCancel: () => void;
}>;
