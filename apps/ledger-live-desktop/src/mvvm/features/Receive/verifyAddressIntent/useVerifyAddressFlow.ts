import { useCallback, useMemo, useRef, useState } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { ReceiveVerification } from "@domain/entity-account-receive";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

/** The address the device shows: what the `receive` account data says it derives. */
export type DeviceShownVerification = Extract<ReceiveVerification, { type: "address" }>;

/** The account whose receive address is being verified, and the asset it receives. */
export type VerifyAddressSelection = Readonly<{
  /** Legacy account the `getAddress` call reads, until sync moves off it. */
  account: Account;
  verification: DeviceShownVerification;
  /** The coin whose app runs the verification. */
  network: CryptoCurrency;
  token?: TokenCurrency;
}>;

/** How the device flow ended. `mismatch` must close the receive flow: the address can't be shared. */
export type VerifyAddressOutcome =
  | "verified"
  | "cancelled"
  | "unsupported"
  | "mismatch"
  | "dismissed"
  | "initFailed";

export type VerifyAddressCallbacks = Readonly<{
  /** The executor dialog is showing: the address dialog can step aside. */
  onReady?: () => void;
  /** The executor left, with the outcome that drives navigation. */
  onDone?: (outcome: VerifyAddressOutcome) => void;
}>;

/** Controls the app-side Device Intent Executor host for the verify flow. */
export type VerifyAddressDeviceIntent = Readonly<{
  /** Selection to verify; `null` while no verification runs. */
  selection: VerifyAddressSelection | null;
  onReady: () => void;
  onExit: (outcome: VerifyAddressOutcome) => void;
}>;

export type UseVerifyAddressFlow = Readonly<{
  /** Mounts the device verification right away, without an intro step. */
  start: (selection: VerifyAddressSelection, callbacks?: VerifyAddressCallbacks) => void;
  deviceIntent: VerifyAddressDeviceIntent;
}>;

export function useVerifyAddressFlow(): UseVerifyAddressFlow {
  const [selection, setSelection] = useState<VerifyAddressSelection | null>(null);
  const callbacksRef = useRef<VerifyAddressCallbacks>({});

  const start = useCallback(
    (nextSelection: VerifyAddressSelection, callbacks: VerifyAddressCallbacks = {}) => {
      callbacksRef.current = callbacks;
      setSelection(nextSelection);
    },
    [],
  );

  const onReady = useCallback(() => callbacksRef.current.onReady?.(), []);

  const onExit = useCallback((outcome: VerifyAddressOutcome) => {
    const { onDone } = callbacksRef.current;
    callbacksRef.current = {};
    setSelection(null);
    onDone?.(outcome);
  }, []);

  const deviceIntent = useMemo<VerifyAddressDeviceIntent>(
    () => ({ selection, onReady, onExit }),
    [selection, onReady, onExit],
  );

  return { start, deviceIntent };
}
