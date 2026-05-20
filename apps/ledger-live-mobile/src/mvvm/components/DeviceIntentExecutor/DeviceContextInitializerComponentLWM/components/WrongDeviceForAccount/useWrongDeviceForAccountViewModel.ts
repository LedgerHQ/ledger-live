import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type Params = Readonly<{
  device: InitializerDevice;
  onCancel: () => void;
}>;

export function useWrongDeviceForAccountViewModel({ device, onCancel }: Params) {
  const { openSupport } = useInitializerActions(device);

  return {
    onCancel,
    onContactSupport: openSupport,
  };
}
