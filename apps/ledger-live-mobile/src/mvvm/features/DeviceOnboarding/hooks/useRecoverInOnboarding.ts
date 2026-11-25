import { useFeature } from "@features/platform-feature-flags";
import { flagRegistry } from "@shared/feature-flags";

const defaultFlagParams = flagRegistry.deviceOnboarding.parse(undefined).params;

/** The deviceOnboarding `recover` param, the kill switch for every Recover step of the flow. */
export function useRecoverInOnboarding(): boolean {
  const deviceOnboarding = useFeature("deviceOnboarding");
  // A saved value can predate the param, so it falls back to its default.
  return { ...defaultFlagParams, ...deviceOnboarding?.params }.recover === true;
}
