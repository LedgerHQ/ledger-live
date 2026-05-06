import type { DiscoveryError } from "../../types";

export type DiscoveryPreflightResult =
  | {
      success: true;
    }
  | {
      success: false;
      discoveryError: DiscoveryError;
    };

export interface DiscoveryPreflightChecks {
  getPreflight(): Promise<DiscoveryPreflightResult>;
}

export const successPreflightResult: DiscoveryPreflightResult = { success: true };

export const mapDiscoveryErrorToPreflightResult = (
  discoveryError: DiscoveryError,
): DiscoveryPreflightResult => ({
  success: false,
  discoveryError,
});

export const retryPreflightCheck = async (
  check: () => Promise<DiscoveryPreflightResult>,
): Promise<true | DiscoveryError> => {
  const result = await check();

  return result.success ? true : result.discoveryError;
};
