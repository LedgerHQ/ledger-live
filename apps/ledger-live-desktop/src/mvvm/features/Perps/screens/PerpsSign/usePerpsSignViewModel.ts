import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Theme } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import useTheme from "~/renderer/hooks/useTheme";
import { getProductName } from "LLD/utils/getProductName";

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
  theme: Theme["theme"];
  device: Device | null;
  productName: string;
  action: ConnectAppAction;
  request: {
    appName: string | undefined;
    requireLatestFirmware?: boolean;
    allowPartialDependencies?: boolean;
    skipAppInstallIfNotFound?: boolean;
  };
  t: ReturnType<typeof useTranslation>["t"];
  handleDeviceResult: (result: AppResult) => void;
};

export function usePerpsSignViewModel(
  data: PerpsSignData,
  onClose: () => void,
): PerpsSignViewModel {
  const { t } = useTranslation();
  const styledTheme = useTheme();
  const [device, setDevice] = useState<Device | null>(null);
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

  const productName = device ? getProductName(device.modelId) : "";

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

  const handleDeviceResult = (result: AppResult) => {
    setDevice(result.device);
  };

  return {
    phase: device ? "sign" : "connect",
    theme: styledTheme.theme as Theme["theme"],
    device,
    productName,
    action,
    request,
    t,
    handleDeviceResult,
  };
}
