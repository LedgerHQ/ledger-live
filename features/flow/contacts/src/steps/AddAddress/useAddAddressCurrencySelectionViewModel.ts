import { useCallback, useMemo, useRef, useState } from "react";
import type { ContactAddress } from "@domain/entity-contact";
import { useContactsFeature, type ContactsFeaturePlatform } from "../../featureFlags";
import type { ContactsCurrencySelectionPort } from "./model/ports";
import { resolveEligibleAddressCurrencyIds } from "./model/resolveEligibleAddressCurrencyIds";

export type UseAddAddressCurrencySelectionViewModelOptions = Readonly<{
  platform: ContactsFeaturePlatform;
  currencySelection: ContactsCurrencySelectionPort;
}>;

export type AddAddressCurrencySelectionResult =
  | Readonly<{
      status: "selected";
      currencyId: ContactAddress["currencyId"];
    }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "busy" }>;

export type AddAddressCurrencySelectionViewModel = Readonly<{
  selectedCurrencyId: ContactAddress["currencyId"] | null;
  selectCurrency: () => Promise<AddAddressCurrencySelectionResult>;
}>;

export function useAddAddressCurrencySelectionViewModel({
  platform,
  currencySelection,
}: UseAddAddressCurrencySelectionViewModelOptions): AddAddressCurrencySelectionViewModel {
  const { eligibleAddressFamilies } = useContactsFeature(platform);
  const eligibleNetworkIds = useMemo(
    () => resolveEligibleAddressCurrencyIds(eligibleAddressFamilies),
    [eligibleAddressFamilies],
  );
  const isSelectingRef = useRef(false);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<ContactAddress["currencyId"] | null>(
    null,
  );
  const selectCurrency = useCallback(async () => {
    if (eligibleNetworkIds.length === 0) {
      return { status: "unavailable" } as const;
    }
    if (isSelectingRef.current) {
      return { status: "busy" } as const;
    }

    isSelectingRef.current = true;

    try {
      const currencyId = await currencySelection.selectCurrency(eligibleNetworkIds);

      if (currencyId === null) {
        return { status: "cancelled" } as const;
      }

      setSelectedCurrencyId(currencyId);
      return { status: "selected", currencyId } as const;
    } finally {
      isSelectingRef.current = false;
    }
  }, [currencySelection, eligibleNetworkIds]);

  return {
    selectedCurrencyId,
    selectCurrency,
  };
}
