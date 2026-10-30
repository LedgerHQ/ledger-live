import {
  requiresLegacyFlow,
  type DeviceOnboardingContext,
} from "@features/platform-device-onboarding";

/** A seeded device whose firmware the new checks cannot handle. */
export function firmwareNeedsLegacyFlow(context: DeviceOnboardingContext): boolean {
  return (
    context.isOnboarded === true &&
    (context.firmwareVersion === null ||
      requiresLegacyFlow({
        currentVersion: context.firmwareVersion,
        deviceModelId: context.deviceModelId,
      }))
  );
}
