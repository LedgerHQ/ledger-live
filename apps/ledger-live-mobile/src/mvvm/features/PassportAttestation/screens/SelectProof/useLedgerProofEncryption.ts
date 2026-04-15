import { useCallback, useMemo, useState } from "react";
import { DeviceActionStatus, type DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  LedgerKeyringProtocolBuilder,
  LKRPEnv,
  type LedgerKeyringProtocol,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { EMPTY, firstValueFrom, mergeMap, of, throwError } from "rxjs";
export type SelectedProof = "age" | "ofac" | "legalName";

const LEDGER_PROOF_ENCRYPTION_INTENT = "+18 age attestation";

export function formatEncryptedProof(encryptedPayload: Uint8Array) {
  return Array.from(encryptedPayload, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function useLedgerProofEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const dmk = useDeviceManagementKit();

  const ledgerKeyringProtocol = useMemo<LedgerKeyringProtocol | null>(() => {
    if (!dmk) {
      return null;
    }

    return new LedgerKeyringProtocolBuilder({
      dmk,
      applicationId: 16,
      env: LKRPEnv.PROD,
    }).build();
  }, [dmk]);

  const encryptProofWithDevice = useCallback(
    async (discoveredDevice: DiscoveredDevice, proof: string) => {
      if (!dmk || !ledgerKeyringProtocol) {
        throw new Error("DMK unavailable");
      }

      let sessionId: string | null = null;
      setIsEncrypting(true);

      try {
        sessionId = await dmk.connect({
          device: discoveredDevice,
          sessionRefresherOptions: { isRefresherDisabled: true },
        });

        const action = ledgerKeyringProtocol.ledgerProofEncrypt({
          intent: LEDGER_PROOF_ENCRYPTION_INTENT,
          blob: new TextEncoder().encode(proof),
          sessionId,
        });

        const encryptedPayload = await firstValueFrom(
          action.observable.pipe(
            mergeMap(result => {
              if (result.status === DeviceActionStatus.Error) {
                return throwError(() => result.error);
              }

              if (result.status === DeviceActionStatus.Completed) {
                return of(result.output);
              }

              return EMPTY;
            }),
          ),
        );

        return formatEncryptedProof(encryptedPayload);
      } finally {
        if (sessionId) {
          await dmk.disconnect({ sessionId }).catch(() => undefined);
        }

        setIsEncrypting(false);
      }
    },
    [dmk, ledgerKeyringProtocol],
  );

  return {
    encryptProofWithDevice,
    isEncrypting,
  };
}
