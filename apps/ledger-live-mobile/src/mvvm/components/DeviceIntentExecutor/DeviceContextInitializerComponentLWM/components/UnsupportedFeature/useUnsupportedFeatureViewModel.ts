import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useUnsupportedFeatureViewModel({ device }: Params) {
  const { openSupport } = useInitializerActions(device);

  return {
    onContactSupport: openSupport,
  };
}
