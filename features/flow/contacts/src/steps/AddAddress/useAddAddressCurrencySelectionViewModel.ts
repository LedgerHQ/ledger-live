import { useCallback, useMemo, useRef, useState } from "react";
import { useContactsFeature, type ContactsFeaturePlatform } from "../../featureFlags";
import type { ContactsCurrencySelectionPort } from "./model/ports";
import { resolveEligibleAddressCurrencyIds } from "./model/resolveEligibleAddressCurrencyIds";
import type { AddAddressCurrencySelection } from "./types";

export type UseAddAddressCurrencySelectionViewModelOptions = Readonly<{
  platform: ContactsFeaturePlatform;
  currencySelection: ContactsCurrencySelectionPort;
}>;

export type AddAddressCurrencySelectionResult =
  | Readonly<{
      status: "selected";
      selection: AddAddressCurrencySelection;
    }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "busy" }>;

export type AddAddressCurrencySelectionViewModel = Readonly<{
  selectedCurrency: AddAddressCurrencySelection | null;
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
  const [selectedCurrency, setSelectedCurrency] = useState<AddAddressCurrencySelection | null>(
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
      const selection = await currencySelection.selectCurrency(eligibleNetworkIds);

      if (selection === null) {
        return { status: "cancelled" } as const;
      }

      setSelectedCurrency(selection);
      return { status: "selected", selection } as const;
    } catch {
      return { status: "cancelled" } as const;
    } finally {
      isSelectingRef.current = false;
    }
  }, [currencySelection, eligibleNetworkIds]);

  return {
    selectedCurrency,
    selectCurrency,
  };
}
