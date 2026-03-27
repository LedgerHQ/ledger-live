import { useCallback, useEffect, useMemo, useState } from "react";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { CONNECTION_TYPES } from "~/renderer/analytics/hooks/variables";
import type { TransferProposalAction } from "./types";

type Input = {
  isOpen: boolean;
  onConfirm: (deviceId: string) => Promise<void>;
  action: TransferProposalAction;
  appName: string;
  onClose?: () => void;
};

export type ConfirmationState = "pending" | "confirming" | "completed" | "error";

export type DeviceAppModalViewModel = {
  isOpen: boolean;
  action: TransferProposalAction;
  onClose?: () => void;
  confirmationState: ConfirmationState;
  error: Error | null;
  request: { appName: string };
  actionConnect: ReturnType<typeof useConnectAppAction>;
  handleDeviceResult: (result: { device?: { deviceId?: string; wired?: boolean } }) => void;
  handleRetry: () => void;
};

export function useDeviceAppModalViewModel({
  isOpen,
  onConfirm,
  action,
  appName,
  onClose,
}: Input): DeviceAppModalViewModel {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>("pending");
  const [error, setError] = useState<Error | null>(null);

  const actionConnect = useConnectAppAction();

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
    (result: { device?: { deviceId?: string; wired?: boolean } }) => {
      if (result?.device) {
        const deviceId =
          result.device.deviceId ||
          (result.device.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE);
        handleConfirm(deviceId);
      }
    },
    [handleConfirm],
  );

  return {
    isOpen,
    action,
    onClose,
    confirmationState,
    error,
    request,
    actionConnect,
    handleDeviceResult,
    handleRetry,
  };
}
