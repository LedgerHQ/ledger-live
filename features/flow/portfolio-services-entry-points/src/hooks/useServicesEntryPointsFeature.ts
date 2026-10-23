import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { resolveServices } from "../utils/resolveServices";
import type { ServiceEntryPointId } from "../types";
import { usePlatformServicesConfig } from "./usePlatformServicesConfig";

export type ServicesEntryPointsFeature = Readonly<{
  isEnabled: boolean;
  services: ServiceEntryPointId[];
}>;

export function useServicesEntryPointsFeature(): ServicesEntryPointsFeature {
  const feature = useFeature("entryPointsServices");
  const { availability, isAssetSectionDisplayed } = usePlatformServicesConfig();
  const isEnabled = (feature?.enabled ?? false) && isAssetSectionDisplayed;
  const order = feature?.params?.services;
  const { perps, borrow } = availability;

  const services = useMemo(
    function resolveEnabledServices() {
      return isEnabled ? resolveServices(order, { perps, borrow }) : [];
    },
    [isEnabled, order, perps, borrow],
  );

  return { isEnabled, services };
}
