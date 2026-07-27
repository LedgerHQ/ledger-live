import { useCallback, useMemo, useRef, useState } from "react";
import type { ContactAddress } from "@domain/entity-contact";
import { useContactsFeature, type ContactsFeaturePlatform } from "../../featureFlags";
import type { ContactsCurrencySelectionPort } from "./model/ports";
import {
  resolveEligibleAddressCurrencyIds,
  type ContactsAddressCurrencyDescriptor,
} from "./model/resolveEligibleAddressCurrencyIds";

export type UseAddAddressCurrencySelectionViewModelOptions = Readonly<{
  platform: ContactsFeaturePlatform;
  currencyCatalog: readonly ContactsAddressCurrencyDescriptor[];
  currencySelection: ContactsCurrencySelectionPort;
}>;

export type AddAddressCurrencySelectionViewModel = Readonly<{
  selectedCurrencyId: ContactAddress["currencyId"] | null;
  selectCurrency: () => Promise<void>;
}>;

export function useAddAddressCurrencySelectionViewModel({
  platform,
  currencyCatalog,
  currencySelection,
}: UseAddAddressCurrencySelectionViewModelOptions): AddAddressCurrencySelectionViewModel {
  const { eligibleAddressFamilies } = useContactsFeature(platform);
  const eligibleCurrencyIds = useMemo(
    () => resolveEligibleAddressCurrencyIds(eligibleAddressFamilies, currencyCatalog),
    [currencyCatalog, eligibleAddressFamilies],
  );
  const eligibleCurrencyIdSet = useMemo(() => new Set(eligibleCurrencyIds), [eligibleCurrencyIds]);
  const isSelectingRef = useRef(false);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<ContactAddress["currencyId"] | null>(
    null,
  );
  const selectCurrency = useCallback(async () => {
    if (eligibleCurrencyIds.length === 0 || isSelectingRef.current) {
      return;
    }

    isSelectingRef.current = true;

    try {
      const currencyId = await currencySelection.selectCurrency(eligibleCurrencyIds);

      if (currencyId !== null && eligibleCurrencyIdSet.has(currencyId)) {
        setSelectedCurrencyId(currencyId);
      }
    } finally {
      isSelectingRef.current = false;
    }
  }, [currencySelection, eligibleCurrencyIds, eligibleCurrencyIdSet]);

  return {
    selectedCurrencyId,
    selectCurrency,
  };
}
