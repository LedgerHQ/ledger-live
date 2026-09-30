import type { MobileDiscoveryError } from "../../types";

export type DiscoveryPreflightResult =
  | {
      success: true;
    }
  | {
      success: false;
      discoveryError: MobileDiscoveryError;
    };

export interface DiscoveryPreflightChecks {
  getPreflight(): Promise<DiscoveryPreflightResult>;
}

export const successPreflightResult: DiscoveryPreflightResult = { success: true };

export const mapDiscoveryErrorToPreflightResult = (
  discoveryError: MobileDiscoveryError,
): DiscoveryPreflightResult => ({
  success: false,
  discoveryError,
});

export const retryPreflightCheck = async (
  check: () => Promise<DiscoveryPreflightResult>,
): Promise<true | MobileDiscoveryError> => {
  const result = await check();

  return result.success ? true : result.discoveryError;
};
