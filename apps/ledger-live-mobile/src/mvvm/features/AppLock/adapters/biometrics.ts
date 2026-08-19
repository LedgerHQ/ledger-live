import {
  classifyBiometricsPromptError,
  type BiometricsAvailability,
  type BiometricsKind,
  type BiometricsPromptResult,
} from "@features/platform-app-lock";
import ReactNativeBiometrics from "react-native-biometrics";
import * as Keychain from "react-native-keychain";

export async function getBiometricsAvailability(): Promise<BiometricsAvailability> {
  const kind = await Keychain.getSupportedBiometryType();

  return kind === null
    ? { status: "unavailable" }
    : { status: "available", kind: kind as BiometricsKind };
}

const PROMPT_SERVICE = "com.ledger.live.appLock.biometricCanary";
const PROMPT_USERNAME = "app-lock";

// Not a read of a biometry-gated item: Android reports a correct device PIN as a success the
// keystore key cannot consume, and such a read can also succeed with no prompt at all.
export async function promptBiometrics(reason: string): Promise<BiometricsPromptResult> {
  try {
    const { success, error } = await new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    }).simplePrompt({ promptMessage: reason });

    if (success) {
      return { status: "succeeded" };
    }

    return { status: classifyBiometricsPromptError(new Error(error ?? "")) };
  } catch (error) {
    return { status: classifyBiometricsPromptError(error) };
  }
}

// A plain item, not a biometry-gated one: nothing reads it back, and gating it added a second
// system prompt on top of ours.
export async function armBiometricPrompt(): Promise<boolean> {
  const stored = await Keychain.setGenericPassword(PROMPT_USERNAME, "armed", {
    service: PROMPT_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return stored !== false;
}

// The protection state is not persisted, so without reading this back the app forgets biometrics
// on every restart.
export async function hasArmedBiometricPrompt(): Promise<boolean> {
  return Keychain.hasGenericPassword({ service: PROMPT_SERVICE });
}

export async function disarmBiometricPrompt(): Promise<void> {
  await Keychain.resetGenericPassword({ service: PROMPT_SERVICE });
}
