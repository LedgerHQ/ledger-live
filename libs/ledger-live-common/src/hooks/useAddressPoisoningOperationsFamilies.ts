import { getEnv } from "@ledgerhq/live-env";
import { useFeature } from "../featureFlags";
import { useMemo } from "react";

type AddressPoisoningOperationsFilterArgs = {
  shouldFilter: boolean;
};

export function useAddressPoisoningOperationsFamilies({
  shouldFilter,
}: AddressPoisoningOperationsFilterArgs): string[] | null {
  const addressPoisoningOperationsFilterFeature = useFeature("addressPoisoningOperationsFilter");

  return useMemo(() => {
    if (!shouldFilter) return null;

    const isFeatureEnabled = addressPoisoningOperationsFilterFeature?.enabled;

    if (!isFeatureEnabled)
      return getEnv("ADDRESS_POISONING_FAMILIES")
        .split(",")
        .map((s: string) => s.trim());

    const families = addressPoisoningOperationsFilterFeature?.params?.families
      ? addressPoisoningOperationsFilterFeature.params.families
      : null;

    return families;
  }, [shouldFilter, addressPoisoningOperationsFilterFeature]);
}
