import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AddAddressCurrencySelection } from "@features/flow-contacts-add-address";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import {
  type DisabledItemsTooltip,
  type DisabledItemTooltip,
  type ModularDrawerFlowProps,
  useModularDrawerController,
} from "LLM/features/ModularDrawer";

const FLOW = "contacts_add_address";

const CONTACTS_CURRENCY_SELECTION_CONFIGURATION = {
  assetsConfiguration: { leftElement: "undefined", rightElement: "undefined" },
  networksConfiguration: { leftElement: "undefined", rightElement: "undefined" },
} as const;

type UseContactsCurrencySelectionAdapterOptions = Readonly<{
  isOpen: boolean;
  networkIds: readonly string[];
  onCurrencySelected: (selection: AddAddressCurrencySelection) => void;
  onSelectionCancelled: () => void;
}>;

export type ContactsCurrencySelectionAdapter = Readonly<{
  flowProps: Omit<ModularDrawerFlowProps, "children">;
  unsupportedItemTooltip: DisabledItemTooltip | null;
  dismissUnsupportedItemTooltip: () => void;
}>;

function resolveContactCurrencySelection(
  currency: CryptoOrTokenCurrency | null,
): AddAddressCurrencySelection | null {
  const parsedCurrencyId = ContactCurrencyIdSchema.safeParse(currency?.id);
  return parsedCurrencyId.success && currency
    ? {
        currencyId: parsedCurrencyId.data,
        assetDisplayName: currency.name,
      }
    : null;
}

export function useContactsCurrencySelectionAdapter({
  isOpen,
  networkIds,
  onCurrencySelected,
  onSelectionCancelled,
}: UseContactsCurrencySelectionAdapterOptions): ContactsCurrencySelectionAdapter {
  const { t } = useTranslation();
  const [unsupportedItemTooltip, setUnsupportedItemTooltip] = useState<DisabledItemTooltip | null>(
    null,
  );
  const selectionStartedRef = useRef(false);
  const closeDrawerRef = useRef<() => void>(() => undefined);
  const {
    areCurrenciesFiltered,
    closeDrawer,
    handleAccountSelected,
    handleCurrencySelected,
    isOpen: isModularDrawerOpen,
    openDrawer,
    preselectedCurrencies,
    uiUseCase,
    useCase,
  } = useModularDrawerController();
  const disabledItemsTooltip = useMemo<DisabledItemsTooltip>(
    () => ({
      asset: assetName => ({
        title: t("modularDrawer.unsupportedAssetTooltip.title", { asset: assetName }),
        content: t("modularDrawer.unsupportedAssetTooltip.description", { asset: assetName }),
      }),
      network: (networkName, assetName) => ({
        title: t("modularDrawer.unsupportedNetworkTooltip.title", { network: networkName }),
        content: t("modularDrawer.unsupportedNetworkTooltip.description", {
          network: networkName,
          asset: assetName,
        }),
      }),
      onPress: setUnsupportedItemTooltip,
    }),
    [t],
  );
  const completeSelection = useCallback(
    (currency: CryptoOrTokenCurrency | null) => {
      const selection = resolveContactCurrencySelection(currency);
      if (selection) {
        onCurrencySelected(selection);
      } else {
        onSelectionCancelled();
      }
    },
    [onCurrencySelected, onSelectionCancelled],
  );

  useEffect(() => {
    closeDrawerRef.current = closeDrawer;
  }, [closeDrawer]);

  useEffect(
    () => () => {
      if (selectionStartedRef.current) {
        selectionStartedRef.current = false;
        closeDrawerRef.current();
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      selectionStartedRef.current = false;
      setUnsupportedItemTooltip(null);
      return;
    }
    if (selectionStartedRef.current) {
      return;
    }

    selectionStartedRef.current = true;
    openDrawer({
      ...CONTACTS_CURRENCY_SELECTION_CONFIGURATION,
      completionMode: "currency",
      enableAccountSelection: false,
      flow: FLOW,
      presentation: "embedded",
      source: ScreenName.MyWalletContactDetail,
      selectableNetworkIds: [...networkIds],
      onCurrencySelected: completeSelection,
    });
  }, [completeSelection, isOpen, networkIds, openDrawer]);

  const flowProps = useMemo<Omit<ModularDrawerFlowProps, "children">>(
    () => ({
      areCurrenciesFiltered,
      ...CONTACTS_CURRENCY_SELECTION_CONFIGURATION,
      currencies: preselectedCurrencies,
      isOpen: isModularDrawerOpen,
      onAccountSelected: handleAccountSelected,
      onClose: closeDrawer,
      onCurrencySelected: handleCurrencySelected,
      uiUseCase,
      useCase,
      selectableNetworkIds: networkIds,
      disabledItemsTooltip,
    }),
    [
      areCurrenciesFiltered,
      closeDrawer,
      handleAccountSelected,
      handleCurrencySelected,
      isModularDrawerOpen,
      networkIds,
      preselectedCurrencies,
      uiUseCase,
      useCase,
      disabledItemsTooltip,
    ],
  );

  const dismissUnsupportedItemTooltip = useCallback(() => setUnsupportedItemTooltip(null), []);

  return { flowProps, unsupportedItemTooltip, dismissUnsupportedItemTooltip };
}
