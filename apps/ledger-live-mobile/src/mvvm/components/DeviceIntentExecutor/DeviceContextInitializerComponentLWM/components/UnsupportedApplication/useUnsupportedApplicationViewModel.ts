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

export function useUnsupportedApplicationViewModel({ device, sourceFlow }: Params) {
  const { openSupport } = useInitializerActions(device);
  const modelId = device.modelId;

  const onContactSupport = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.ContactLedgerSupport,
    });
    openSupport();
  }, [openSupport, sourceFlow, modelId]);

  return {
    onContactSupport,
  };
}
