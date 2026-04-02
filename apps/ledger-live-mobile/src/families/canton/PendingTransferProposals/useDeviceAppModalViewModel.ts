import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "~/context/hooks";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { lastConnectedDeviceSelector } from "~/reducers/settings";

type Input = {
  isOpen: boolean;
  onConfirm: (deviceId: string) => Promise<void>;
  appName: string;
};

export type ConfirmationState = "pending" | "confirming" | "completed" | "error";

export type DeviceAppModalViewModel = {
  confirmationState: ConfirmationState;
  error: Error | null;
  request: { appName: string };
  device: ReturnType<typeof lastConnectedDeviceSelector>;
  actionConnect: ReturnType<typeof useAppDeviceAction>;
  handleDeviceResult: (deviceResult: AppResult) => void;
  handleRetry: () => void;
};

export function useDeviceAppModalViewModel({
  isOpen,
  onConfirm,
  appName,
}: Input): DeviceAppModalViewModel {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>("pending");
  const [error, setError] = useState<Error | null>(null);

  const actionConnect = useAppDeviceAction();
  const device = useSelector(lastConnectedDeviceSelector);

  const request = useMemo(() => ({ appName }), [appName]);

  useEffect(() => {
    if (isOpen) {
      setConfirmationState("pending");
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = useCallback(
    async (deviceId: string) => {
      try {
        setConfirmationState("confirming");
        await onConfirm(deviceId);
        setConfirmationState("completed");
      } catch (err) {
        setConfirmationState("error");
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [onConfirm],
  );

  const handleRetry = useCallback(() => {
    setConfirmationState("pending");
    setError(null);
  }, []);

  const handleDeviceResult = useCallback(
    (deviceResult: AppResult) => {
      if (deviceResult?.device) {
        const deviceId =
          deviceResult.device.deviceId || (deviceResult.device.wired ? "usb" : "ble");
        handleConfirm(deviceId);
      }
    },
    [handleConfirm],
  );

  return {
    confirmationState,
    error,
    request,
    device,
    actionConnect,
    handleDeviceResult,
    handleRetry,
  };
}
