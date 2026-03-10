import { useEffect, useMemo, useRef, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { getDeviceModel } from "@ledgerhq/devices";
import type { AppInstallConfig } from "../../constants/appInstallMap";

interface UseInstallingContentViewModelParams {
  device: Device;
  appConfig: AppInstallConfig;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export function useInstallingContentViewModel({
  device,
  appConfig,
  onSuccess,
  onError,
}: UseInstallingContentViewModelParams) {
  const action = useAppDeviceAction();

  const commandRequest = useMemo(
    () => ({
      dependencies: [{ appName: appConfig.appName }],
      appName: "BOLOS",
      withInlineInstallProgress: true,
      allowPartialDependencies: true,
    }),
    [appConfig.appName],
  );

  const status = action.useHook(device, commandRequest);

  const {
    allowManagerRequested = false,
    listingApps = false,
    error,
    progress,
    opened,
  } = status || {};

  const [showAllowManager, setShowAllowManager] = useState(false);
  const allowManagerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCalledSuccess = useRef(false);
  const hasCalledError = useRef(false);

  useEffect(() => {
    if (allowManagerRequested) {
      allowManagerTimerRef.current = setTimeout(() => {
        setShowAllowManager(true);
      }, 300);
    } else {
      if (allowManagerTimerRef.current) {
        clearTimeout(allowManagerTimerRef.current);
        allowManagerTimerRef.current = null;
      }
      setShowAllowManager(false);
    }

    return () => {
      if (allowManagerTimerRef.current) {
        clearTimeout(allowManagerTimerRef.current);
      }
    };
  }, [allowManagerRequested]);

  useEffect(() => {
    if (opened && !hasCalledSuccess.current) {
      hasCalledSuccess.current = true;
      onSuccess();
    }
  }, [opened, onSuccess]);

  useEffect(() => {
    if (error && !hasCalledError.current) {
      hasCalledError.current = true;
      onError(error);
    }
  }, [error, onError]);

  const productName = getDeviceModel(device.modelId)?.productName ?? "";

  return {
    showAllowManager,
    listingApps,
    progress,
    productName,
  };
}
