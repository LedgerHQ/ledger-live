import { useCallback, useState } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Hex, SignTypedData } from "@ledgerhq/coin-evm/confidential";
import { DeviceRefusedError, mockSignTypedData } from "../utils/confidentialApi";
import { isRealConfidentialApi } from "../utils/confidentialRuntime";
import { signPermitOnDevice } from "../utils/devicePermitSigner";
import { signTransactionOnDevice } from "../utils/deviceTransactionSigner";
import type { SignTransaction } from "../utils/deviceTransactionExecutor";

// One device request at a time: a permit for a reveal, or an unshield finalize.
type PendingSignature =
  | {
      kind: "typedData";
      typedData: Parameters<SignTypedData>[0];
      resolve: (signature: Hex) => void;
      reject: (error: unknown) => void;
    }
  | {
      kind: "transaction";
      transaction: string;
      resolve: (signature: string) => void;
      reject: (error: unknown) => void;
    };

export function usePermitSigner(parentAccount: Account | undefined) {
  const [pending, setPending] = useState<PendingSignature | null>(null);

  const signTypedData = useCallback<SignTypedData>(
    typedData =>
      isRealConfidentialApi()
        ? new Promise<Hex>((resolve, reject) =>
            setPending({ kind: "typedData", typedData, resolve, reject }),
          )
        : mockSignTypedData(typedData),
    [],
  );

  const signTransaction = useCallback<SignTransaction>(
    transaction =>
      new Promise<string>((resolve, reject) =>
        setPending({ kind: "transaction", transaction, resolve, reject }),
      ),
    [],
  );

  const onDeviceConnected = useCallback(
    async (deviceId: string) => {
      if (!pending || !parentAccount) return;
      const path = parentAccount.freshAddressPath;
      try {
        if (pending.kind === "typedData") {
          pending.resolve(await signPermitOnDevice(deviceId, path, pending.typedData));
        } else {
          pending.resolve(await signTransactionOnDevice(deviceId, path, pending.transaction));
        }
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
    signTransaction,
    deviceSignature: {
      isOpen: pending !== null,
      appName: parentAccount?.currency.managerAppName ?? "Ethereum",
      onDeviceConnected,
      onCancel,
    },
  };
}

export type PermitDeviceSignature = ReturnType<typeof usePermitSigner>["deviceSignature"];
