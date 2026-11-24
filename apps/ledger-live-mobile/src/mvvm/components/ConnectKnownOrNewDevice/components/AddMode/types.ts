import type { ConnectNewDeviceViewProps } from "LLM/components/ConnectNewDevice";

export type AddModeProps = Omit<ConnectNewDeviceViewProps, "isNewDevice"> & {
  onClose: () => void;
};

export type AddModeViewProps = ConnectNewDeviceViewProps & {
  onClose: () => void;
};
