import { useMemo, useState } from "react";
import { CONNECTION_TYPES } from "~/renderer/analytics/hooks/variables";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import type { PermitDeviceSignature } from "../../hooks/usePermitSigner";

type DeviceResult = { device?: { deviceId?: string; wired?: boolean } };

export function usePermitDeviceModalViewModel({
  isOpen,
  appName,
  onDeviceConnected,
  onCancel,
}: PermitDeviceSignature) {
  const action = useConnectAppAction();
  const request = useMemo(() => ({ appName }), [appName]);
  const [isSigning, setIsSigning] = useState(false);

  const onResult = async (result: DeviceResult) => {
    if (!result?.device) return;
    const deviceId =
      result.device.deviceId || (result.device.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE);
    setIsSigning(true);
    try {
      await onDeviceConnected(deviceId);
    } finally {
      setIsSigning(false);
    }
  };

  return { isOpen, isSigning, action, request, onResult, onClose: onCancel };
}

export type PermitDeviceModalViewModel = ReturnType<typeof usePermitDeviceModalViewModel>;
