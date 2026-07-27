import { useCallback, useMemo, useRef, useState } from "react";
import type { ContactAddress } from "@domain/entity-contact";
import { useContactsFeature, type ContactsFeaturePlatform } from "../../featureFlags";
import type { ContactsCurrencySelectionPort } from "./model/ports";
import { resolveEligibleAddressCurrencyIds } from "./model/resolveEligibleAddressCurrencyIds";

export type UseAddAddressCurrencySelectionViewModelOptions = Readonly<{
  platform: ContactsFeaturePlatform;
  currencySelection: ContactsCurrencySelectionPort;
}>;

export type AddAddressCurrencySelectionViewModel = Readonly<{
  selectedCurrencyId: ContactAddress["currencyId"] | null;
  selectCurrency: () => Promise<void>;
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
    if (eligibleNetworkIds.length === 0 || isSelectingRef.current) {
      return;
    }

    isSelectingRef.current = true;

    try {
      const currencyId = await currencySelection.selectCurrency(eligibleNetworkIds);

      if (currencyId !== null) {
        setSelectedCurrencyId(currencyId);
      }
    } finally {
      isSelectingRef.current = false;
    }
  }, [currencySelection, eligibleNetworkIds]);

  return {
    selectedCurrencyId,
    selectCurrency,
  };
}
