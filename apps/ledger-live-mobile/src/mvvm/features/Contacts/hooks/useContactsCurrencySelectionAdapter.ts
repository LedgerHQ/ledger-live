import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AddAddressCurrencySelection } from "@features/flow-contacts-add-address";
import { track } from "~/analytics/segment";
import { useTranslation } from "~/context/Locale";
import { MODULAR_DRAWER_PAGE_NAME } from "LLM/features/ModularDrawer/analytics/modularDrawer.types";
import {
  type DisabledItemsExplanation,
  type DisabledItemExplanation,
  type ModularDrawerFlowProps,
  useModularDrawerController,
} from "LLM/features/ModularDrawer";

const FLOW = "contacts";
type ContactsDisabledItemExplanation = DisabledItemExplanation &
  Readonly<{
    asset?: string;
    network?: string;
    page: (typeof MODULAR_DRAWER_PAGE_NAME)[keyof typeof MODULAR_DRAWER_PAGE_NAME];
  }>;

const CONTACTS_CURRENCY_SELECTION_CONFIGURATION = {
  assetsConfiguration: { leftElement: "undefined", rightElement: "undefined" },
  networksConfiguration: {
    leftElement: "undefined",
    rightElement: "undefined",
  },
} as const;

type UseContactsCurrencySelectionAdapterOptions = Readonly<{
  isOpen: boolean;
  networkIds: readonly string[];
  onCurrencySelected: (selection: AddAddressCurrencySelection) => void;
  onSelectionCancelled: () => void;
}>;

export type ContactsCurrencySelectionAdapter = Readonly<{
  flowProps: Omit<ModularDrawerFlowProps, "children">;
  unsupportedItemExplanation: DisabledItemExplanation | null;
  dismissUnsupportedItemExplanation: () => void;
}>;

function trackDisabledItemExplanation(explanation: DisabledItemExplanation) {
  const { asset, network, page } = explanation as ContactsDisabledItemExplanation;
  track("button_clicked", {
    button: "disabled network tooltip",
    flow: FLOW,
    page,
    source: "contacts",
    ...(asset ? { asset } : {}),
    ...(network ? { network } : {}),
  });
}

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
  const [unsupportedItemExplanation, setUnsupportedItemExplanation] =
    useState<DisabledItemExplanation | null>(null);
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
  const showUnsupportedItemExplanation = useCallback((explanation: DisabledItemExplanation) => {
    trackDisabledItemExplanation(explanation);
    setUnsupportedItemExplanation(explanation);
  }, []);
  const disabledItemsExplanation = useMemo<DisabledItemsExplanation>(
    () => ({
      asset: assetName => ({
        title: t("modularDrawer.unsupportedAssetExplanation.title", {
          asset: assetName,
        }),
        content: t("modularDrawer.unsupportedAssetExplanation.description", {
          asset: assetName,
        }),
        asset: assetName,
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
      }),
      network: (networkName, assetName) => ({
        title: t("modularDrawer.unsupportedNetworkExplanation.title", {
          network: networkName,
        }),
        content: t("modularDrawer.unsupportedNetworkExplanation.description", {
          network: networkName,
          asset: assetName,
        }),
        network: networkName,
        asset: assetName,
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
      }),
      onPress: showUnsupportedItemExplanation,
    }),
    [t, showUnsupportedItemExplanation],
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
      setUnsupportedItemExplanation(null);
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
      source: "contacts",
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
      disabledItemsExplanation,
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
      disabledItemsExplanation,
    ],
  );

  const dismissUnsupportedItemExplanation = useCallback(
    () => setUnsupportedItemExplanation(null),
    [],
  );

  return {
    flowProps,
    unsupportedItemExplanation,
    dismissUnsupportedItemExplanation,
  };
}
