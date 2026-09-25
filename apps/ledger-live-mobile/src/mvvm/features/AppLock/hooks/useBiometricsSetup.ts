import {
  clearBiometricsMarker,
  promptBiometrics,
  setBiometricsEnabled,
  storeBiometricsMarker,
  type BiometricsPromptLabels,
} from "@features/platform-app-lock";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";

export type BiometricsSetup = Readonly<{
  enable: (labels: BiometricsPromptLabels) => Promise<boolean>;
  disable: (labels: BiometricsPromptLabels) => Promise<boolean>;
}>;

export function useBiometricsSetup(): BiometricsSetup {
  const dispatch = useDispatch();

  const enable = useCallback(
    async (labels: BiometricsPromptLabels) => {
      try {
        // Proven before anything is recorded: it may be their only protection.
        if ((await promptBiometrics(labels)).status !== "succeeded") {
          return false;
        }

        if (!(await storeBiometricsMarker())) {
          return false;
        }
      } catch {
        // Or the rejection escapes through the row's async `onChange` as an unhandled one.
        return false;
      }

      dispatch(setBiometricsEnabled(true));
      return true;
    },
    [dispatch],
  );

  const disable = useCallback(
    async (labels: BiometricsPromptLabels) => {
      try {
        // Proven before removal, as removing a password requires typing it.
        if ((await promptBiometrics(labels)).status !== "succeeded") {
          return false;
        }

        if (!(await clearBiometricsMarker())) {
          return false;
        }
      } catch {
        return false;
      }

      dispatch(setBiometricsEnabled(false));
      return true;
    },
    [dispatch],
  );

  return { enable, disable };
}
