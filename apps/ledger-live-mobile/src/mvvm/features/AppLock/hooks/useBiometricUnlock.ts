import { unlockApp } from "@features/platform-app-lock";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import { promptBiometrics } from "../adapters/biometrics";

export type BiometricUnlock = Readonly<{
  runBiometricUnlock: () => Promise<boolean>;
}>;

export function useBiometricUnlock(): BiometricUnlock {
  const dispatch = useDispatch();

  const runBiometricUnlock = useCallback(async () => {
    const result = await promptBiometrics("Unlock Ledger Wallet");

    if (result.status !== "succeeded") {
      return false;
    }

    dispatch(unlockApp());
    return true;
  }, [dispatch]);

  return { runBiometricUnlock };
}
