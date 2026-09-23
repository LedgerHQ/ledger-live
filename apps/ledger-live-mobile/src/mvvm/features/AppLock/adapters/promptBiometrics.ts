import {
  promptBiometrics as promptDeviceBiometrics,
  type BiometricsPromptLabels,
  type BiometricsPromptResult,
} from "@features/platform-app-lock";
import { AppState } from "react-native";

const ACTIVE_WAIT_MS = 1_000;

function whenAppIsActive(): Promise<void> {
  if (AppState.currentState !== "inactive") {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const settle = () => {
      clearTimeout(timer);
      subscription.remove();
      resolve();
    };

    const timer = setTimeout(settle, ACTIVE_WAIT_MS);
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") {
        settle();
      }
    });
  });
}

// iOS answers while the Face ID sheet is still leaving, and native UI presented before the app is
// active again never appears — the Card login's browser among it.
export async function promptBiometrics(
  labels: BiometricsPromptLabels,
): Promise<BiometricsPromptResult> {
  const result = await promptDeviceBiometrics(labels);

  await whenAppIsActive();

  return result;
}
