import { useCallback } from "react";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { SourceFlow } from "../../../utils/SourceFlowContext";
import {
  CONNECT_APP_BUTTON,
  trackConnectAppButtonClicked,
} from "../../../utils/trackDeviceIntent";

type Params = Readonly<{
  device: InitializerDevice;
  sourceFlow: SourceFlow;
}>;

export function useDeviceNotOnboardedViewModel({ device, sourceFlow }: Params) {
  const { openOnboarding } = useInitializerActions(device);
  const modelId = device.modelId;

  const onSetupDevice = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.SetUpDevice,
    });
    openOnboarding();
  }, [openOnboarding, sourceFlow, modelId]);

  return {
    productName: device.productName,
    onSetupDevice,
  };
}
