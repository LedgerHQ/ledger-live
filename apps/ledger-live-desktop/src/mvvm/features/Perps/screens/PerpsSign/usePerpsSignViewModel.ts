import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

export type PerpsSignData = {
  appName: string | undefined;
  appOptions?: {
    requireLatestFirmware: boolean;
    allowPartialDependencies: boolean;
    skipAppInstallIfNotFound: boolean;
  };
  signFactory: (device: Device) => Promise<PerpsSignResult>;
  onSuccess: (result: PerpsSignResult) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
};

type ConnectAppAction = ReturnType<typeof useConnectAppAction>;

export type PerpsSignViewModel = {
  phase: "connect" | "sign";
  device: Device | null;
  action: ConnectAppAction;
  request: {
    appName: string | undefined;
    requireLatestFirmware?: boolean;
    allowPartialDependencies?: boolean;
    skipAppInstallIfNotFound?: boolean;
  };
  closing: boolean;
  handleDeviceResult: (result: AppResult) => void;
  handleDeviceError: (error: Error) => void;
};

export function usePerpsSignViewModel(
  data: PerpsSignData,
  onClose: () => void,
): PerpsSignViewModel {
  const [device, setDevice] = useState<Device | null>(null);
  const [closing, setClosing] = useState(false);
  const completedRef = useRef(false);

  const action = useConnectAppAction();
  const request = useMemo(
    () => ({
      appName: data.appName,
      requireLatestFirmware: data.appOptions?.requireLatestFirmware,
      allowPartialDependencies: data.appOptions?.allowPartialDependencies,
      skipAppInstallIfNotFound: data.appOptions?.skipAppInstallIfNotFound,
    }),
    [data.appName, data.appOptions],
  );

  useEffect(() => {
    if (!device) return;

    let cancelled = false;

    data
      .signFactory(device)
      .then(result => {
        if (cancelled) return;
        completedRef.current = true;
        data.onSuccess(result);
        onClose();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        completedRef.current = true;
        const e = err instanceof Error ? err : new Error(String(err));
        data.onError(e);
        onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [device, data, onClose]);

  useEffect(() => {
    return () => {
      if (!completedRef.current) {
        data.onCancel();
      }
    };
  }, [data]);

  const handleDeviceResult = useCallback((result: AppResult) => {
    setDevice(result.device);
  }, []);

  const handleDeviceError = useCallback(
    (error: Error) => {
      setClosing(true);
      completedRef.current = true;
      data.onError(error);
      onClose();
    },
    [data, onClose],
  );

  return {
    phase: device ? "sign" : "connect",
    closing,
    device,
    action,
    request,
    handleDeviceResult,
    handleDeviceError,
  };
}
