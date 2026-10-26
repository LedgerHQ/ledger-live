import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import type { ServiceEntryPointId } from "../types";
import type { ServicesEntryPointsFlag } from "../types.internals";

const DEFAULT_SERVICES_ORDER: readonly ServiceEntryPointId[] =
  FEATURE_FLAGS_DEFAULTS.entryPointsServices.params?.services ?? [];

export function getServicesOrder(flag: ServicesEntryPointsFlag): readonly ServiceEntryPointId[] {
  if (!flag) return [];
  return flag.params?.services ?? DEFAULT_SERVICES_ORDER;
}
