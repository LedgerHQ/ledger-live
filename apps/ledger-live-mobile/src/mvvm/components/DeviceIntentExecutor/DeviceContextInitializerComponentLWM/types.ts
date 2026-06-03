import type { EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { SourceFlow } from "../utils/SourceFlowContext";

export type InitializerDevice = Readonly<{
  id: string;
  modelId: DeviceModelId;
  name: string;
  productName: string;
  wired: boolean;
}>;

export type DeviceContextInitializerComponentLWMViewProps = Readonly<{
  state: EnsureAppReadyState;
  device: InitializerDevice;
  sourceFlow: SourceFlow;
  onCancel: () => void;
}>;

export type BaseInitializerStateProps<State extends EnsureAppReadyState> = Readonly<{
  state: State;
  device: InitializerDevice;
  sourceFlow: SourceFlow;
  onCancel: () => void;
}>;
