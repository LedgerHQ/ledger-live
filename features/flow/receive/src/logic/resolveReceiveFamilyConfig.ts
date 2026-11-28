import type { ReceiveFamilyConfig } from "../types";

export const DEFAULT_RECEIVE_FAMILY_CONFIG: ReceiveFamilyConfig = {
  isSupported: true,
  notices: [],
};

type ResolveReceiveFamilyConfigParams = Readonly<{
  family: string;
  familyConfig?: Partial<ReceiveFamilyConfig>;
  /** `params.excludedFamilies` of the `newReceiveFlow` feature flag. */
  excludedFamilies: readonly string[];
}>;

export function resolveReceiveFamilyConfig({
  family,
  familyConfig,
  excludedFamilies,
}: ResolveReceiveFamilyConfigParams): ReceiveFamilyConfig {
  const config = { ...DEFAULT_RECEIVE_FAMILY_CONFIG, ...familyConfig };
  const isExcludedFromRollout = excludedFamilies.includes(family);
  return isExcludedFromRollout ? { ...config, isSupported: false } : config;
}
