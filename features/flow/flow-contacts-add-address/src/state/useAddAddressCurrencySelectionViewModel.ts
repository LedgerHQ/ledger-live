import { useCallback, useMemo, useRef, useState } from "react";
import {
  resolveEligibleAddressCurrencyIds,
  useContactsFeature,
  type ContactsFeaturePlatform,
  type ContactsConfigResolver,
} from "@features/platform-contacts";
import type { ContactsCurrencySelectionPort } from "./ports";
import type { AddAddressCurrencySelection } from "./types";

export type UseAddAddressCurrencySelectionViewModelOptions = Readonly<{
  platform: ContactsFeaturePlatform;
  currencySelection: ContactsCurrencySelectionPort;
  getConfig: ContactsConfigResolver;
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
  getConfig,
}: UseAddAddressCurrencySelectionViewModelOptions): AddAddressCurrencySelectionViewModel {
  const { eligibleAddressFamilies, excludedCurrencyIds } = useContactsFeature(platform);
  const eligibleNetworkIds = useMemo(
    () =>
      resolveEligibleAddressCurrencyIds(
        eligibleAddressFamilies,
        undefined,
        excludedCurrencyIds,
        getConfig,
      ),
    [eligibleAddressFamilies, excludedCurrencyIds, getConfig],
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
