import { getServicesOrder } from "../utils/getServicesOrder";
import type { ServicesEntryPointsFlag } from "../types.internals";

export function getServicesEntryPointsAttributes(flag: ServicesEntryPointsFlag) {
  return {
    isEnabled: flag?.enabled ?? false,
    services: getServicesOrder(flag),
  };
}
