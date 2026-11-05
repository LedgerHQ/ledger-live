import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { getServicesOrder } from "../utils/getServicesOrder";
import { resolveServices } from "../utils/resolveServices";
import type { ServiceEntryPointId } from "../types";
import { usePlatformServicesConfig } from "./usePlatformServicesConfig";

export type ServicesEntryPointsFeature = Readonly<{
  isEnabled: boolean;
  services: ServiceEntryPointId[];
}>;

export function useServicesEntryPointsFeature(): ServicesEntryPointsFeature {
  const feature = useFeature("entryPointsServices");
  const { availability } = usePlatformServicesConfig();
  const isEnabled = feature?.enabled ?? false;
  const order = getServicesOrder(feature);
  const { perps, borrow, predictions } = availability;

  const services = useMemo(
    function resolveEnabledServices() {
      return isEnabled ? resolveServices(order, { perps, borrow, predictions }) : [];
    },
    [isEnabled, order, perps, borrow, predictions],
  );

  return { isEnabled, services };
}
