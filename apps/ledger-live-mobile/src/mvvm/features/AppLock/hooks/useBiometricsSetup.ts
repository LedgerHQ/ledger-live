import {
  clearBiometricsMarker,
  promptBiometrics,
  setBiometricsEnabled,
  storeBiometricsMarker,
  type BiometricsPromptLabels,
} from "@features/platform-app-lock";
import { track } from "@shared/analytics";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import type { ProtectionSource } from "../types";

export type BiometricsSetup = Readonly<{
  enable: (labels: BiometricsPromptLabels, source: ProtectionSource) => Promise<boolean>;
  disable: (labels: BiometricsPromptLabels, source: ProtectionSource) => Promise<boolean>;
}>;

export function useBiometricsSetup(): BiometricsSetup {
  const dispatch = useDispatch();

  const enable = useCallback(
    async (labels: BiometricsPromptLabels, source: ProtectionSource) => {
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
      track("encryption_updated", { status: "activated", type: "biometrics", source });
      return true;
    },
    [dispatch],
  );

  const disable = useCallback(
    async (labels: BiometricsPromptLabels, source: ProtectionSource) => {
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
      track("encryption_updated", { status: "deactivated", type: "biometrics", source });
      return true;
    },
    [dispatch],
  );

  return { enable, disable };
}
