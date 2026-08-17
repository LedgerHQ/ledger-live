import {
  classifyBiometricsPromptError,
  type BiometricsAvailability,
  type BiometricsKind,
  type BiometricsPromptResult,
} from "@features/platform-app-lock";
import * as Keychain from "react-native-keychain";

export async function getBiometricsAvailability(): Promise<BiometricsAvailability> {
  const kind = await Keychain.getSupportedBiometryType();

  return kind === null
    ? { status: "unavailable" }
    : { status: "available", kind: kind as BiometricsKind };
}

const PROMPT_SERVICE = "com.ledger.live.appLock.biometricCanary";
const PROMPT_USERNAME = "app-lock";

export async function promptBiometrics(reason: string): Promise<BiometricsPromptResult> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: PROMPT_SERVICE,
      authenticationPrompt: { title: reason },
    });

    return credentials ? { status: "succeeded" } : { status: "failed" };
  } catch (error) {
    return { status: classifyBiometricsPromptError(error) };
  }
}

export async function armBiometricPrompt(): Promise<boolean> {
  const stored = await Keychain.setGenericPassword(PROMPT_USERNAME, "armed", {
    service: PROMPT_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return stored !== false;
}

export async function disarmBiometricPrompt(): Promise<void> {
  await Keychain.resetGenericPassword({ service: PROMPT_SERVICE });
}
