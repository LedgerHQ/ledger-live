import type { Feature } from "@shared/feature-flags";
import type { ServicesEntryPointsFlagParams } from "../types.internals";

type ServicesEntryPointsFlag = Feature<ServicesEntryPointsFlagParams> | null | undefined;

export function getServicesEntryPointsAttributes(flag: ServicesEntryPointsFlag) {
  return {
    isEnabled: flag?.enabled ?? false,
    services: flag?.params?.services ?? [],
  };
}
