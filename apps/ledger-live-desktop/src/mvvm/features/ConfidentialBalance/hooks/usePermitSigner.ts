import { useCallback, useState } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Hex, SignTypedData } from "@ledgerhq/coin-evm/confidential";
import { DeviceRefusedError, mockSignTypedData } from "../utils/confidentialApi";
import { isRealConfidentialApi } from "../utils/confidentialRuntime";
import { signPermitOnDevice } from "../utils/devicePermitSigner";

type PendingSignature = {
  typedData: Parameters<SignTypedData>[0];
  resolve: (signature: Hex) => void;
  reject: (error: unknown) => void;
};

export function usePermitSigner(parentAccount: Account | undefined) {
  const [pending, setPending] = useState<PendingSignature | null>(null);

  const signTypedData = useCallback<SignTypedData>(
    typedData =>
      isRealConfidentialApi()
        ? new Promise<Hex>((resolve, reject) => setPending({ typedData, resolve, reject }))
        : mockSignTypedData(typedData),
    [],
  );

  const onDeviceConnected = useCallback(
    async (deviceId: string) => {
      if (!pending || !parentAccount) return;
      try {
        pending.resolve(
          await signPermitOnDevice(deviceId, parentAccount.freshAddressPath, pending.typedData),
        );
      } catch (error) {
        pending.reject(error);
      } finally {
        setPending(null);
      }
    },
    [parentAccount, pending],
  );

  const onCancel = useCallback(() => {
    pending?.reject(new DeviceRefusedError());
    setPending(null);
  }, [pending]);

  return {
    signTypedData,
    deviceSignature: {
      isOpen: pending !== null,
      appName: parentAccount?.currency.managerAppName ?? "Ethereum",
      onDeviceConnected,
      onCancel,
    },
  };
}

export type PermitDeviceSignature = ReturnType<typeof usePermitSigner>["deviceSignature"];
