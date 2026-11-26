import { flagRegistry, type Features } from "@shared/feature-flags";

const defaultFlagParams = flagRegistry.deviceOnboarding.parse(undefined).params;

/** The deviceOnboarding `recover` param, the kill switch for every Recover step of the flow. */
export function isRecoverInOnboarding(
  deviceOnboarding: Features["deviceOnboarding"] | null | undefined,
): boolean {
  const paramsWithDefaults = { ...defaultFlagParams, ...deviceOnboarding?.params };
  return paramsWithDefaults.recover === true;
}
