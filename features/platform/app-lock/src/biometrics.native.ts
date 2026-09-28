import ReactNativeBiometrics from "react-native-biometrics";
import * as Keychain from "react-native-keychain";
import type {
  BiometricsAvailability,
  BiometricsKind,
  BiometricsPromptLabels,
  BiometricsPromptResult,
} from "./biometricsTypes";
import { classifyBiometricsPromptError } from "./promptError";

export async function getBiometricsAvailability(): Promise<BiometricsAvailability> {
  const kind = await Keychain.getSupportedBiometryType();

  return kind === null
    ? { status: "unavailable" }
    : { status: "available", kind: kind as BiometricsKind };
}

// An explicit owner check, not a protected read: such a read can resolve without the OS showing
// anything, and Android reports a correct device PIN as a success the keystore cannot consume. The
// device credential is accepted because biometrics can be the only protection left.
export async function promptBiometrics({
  reason,
  fallback,
  cancel,
}: BiometricsPromptLabels): Promise<BiometricsPromptResult> {
  try {
    const { success, error } = await new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    }).simplePrompt({
      promptMessage: reason,
      fallbackPromptMessage: fallback,
      cancelButtonText: cancel,
    });

    return success
      ? { status: "succeeded" }
      : { status: classifyBiometricsPromptError(new Error(error ?? "")) };
  } catch (error) {
    return { status: classifyBiometricsPromptError(error) };
  }
}

// The service name outlives any rename: it addresses what is already on users' devices.
const MARKER_SERVICE = "com.ledger.live.appLock.biometricCanary";
const MARKER_USERNAME = "app-lock";

// Plain: gating it would add a second system prompt on top of the one above. It records that the
// user turned biometrics on, which the in-memory protection state cannot do on its own.
export async function storeBiometricsMarker(): Promise<boolean> {
  const stored = await Keychain.setGenericPassword(MARKER_USERNAME, "enabled", {
    service: MARKER_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return stored !== false;
}

export async function hasBiometricsMarker(): Promise<boolean> {
  return Keychain.hasGenericPassword({ service: MARKER_SERVICE });
}

// Carried, not discarded: a removal reported but not done leaves the session unprotected.
export async function clearBiometricsMarker(): Promise<boolean> {
  return Keychain.resetGenericPassword({ service: MARKER_SERVICE });
}
