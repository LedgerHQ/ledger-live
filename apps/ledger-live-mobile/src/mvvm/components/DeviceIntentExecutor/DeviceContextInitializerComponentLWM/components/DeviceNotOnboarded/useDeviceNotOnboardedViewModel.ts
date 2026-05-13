import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useDeviceNotOnboardedViewModel({ device }: Params) {
  const { openOnboarding } = useInitializerActions(device);

  return {
    productName: device.productName,
    onSetupDevice: openOnboarding,
  };
}
