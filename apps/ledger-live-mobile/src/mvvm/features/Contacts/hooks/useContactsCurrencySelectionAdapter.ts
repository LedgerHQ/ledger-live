import { useCallback, useEffect, useMemo, useRef } from "react";
import { ContactCurrencyIdSchema, type ContactAddress } from "@domain/entity-contact";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { ScreenName } from "~/const";
import {
  type ModularDrawerFlowProps,
  useModularDrawerController,
} from "LLM/features/ModularDrawer";

const FLOW = "contacts_add_address";

type UseContactsCurrencySelectionAdapterOptions = Readonly<{
  isOpen: boolean;
  networkIds: readonly string[];
  onCurrencySelected: (currencyId: ContactAddress["currencyId"]) => void;
  onSelectionCancelled: () => void;
}>;

export type ContactsCurrencySelectionAdapter = Readonly<{
  flowProps: Omit<ModularDrawerFlowProps, "children">;
}>;

function resolveContactCurrencyId(
  currency: CryptoOrTokenCurrency | null,
): ContactAddress["currencyId"] | null {
  const parsedCurrencyId = ContactCurrencyIdSchema.safeParse(currency?.id);
  return parsedCurrencyId.success ? parsedCurrencyId.data : null;
}

export function useContactsCurrencySelectionAdapter({
  isOpen,
  networkIds,
  onCurrencySelected,
  onSelectionCancelled,
}: UseContactsCurrencySelectionAdapterOptions): ContactsCurrencySelectionAdapter {
  const selectionStartedRef = useRef(false);
  const closeDrawerRef = useRef<() => void>(() => undefined);
  const {
    areCurrenciesFiltered,
    assetsConfiguration,
    closeDrawer,
    handleAccountSelected,
    handleCurrencySelected,
    isOpen: isModularDrawerOpen,
    networksConfiguration,
    openDrawer,
    preselectedCurrencies,
    uiUseCase,
    useCase,
  } = useModularDrawerController();
  const completeSelection = useCallback(
    (currency: CryptoOrTokenCurrency | null) => {
      const currencyId = resolveContactCurrencyId(currency);
      if (currencyId) {
        onCurrencySelected(currencyId);
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
      return;
    }
    if (selectionStartedRef.current) {
      return;
    }

    selectionStartedRef.current = true;
    openDrawer({
      currencies: [...networkIds],
      areCurrenciesFiltered: true,
      completionMode: "currency",
      enableAccountSelection: false,
      flow: FLOW,
      presentation: "embedded",
      source: ScreenName.MyWalletContactDetail,
      onCurrencySelected: completeSelection,
    });
  }, [completeSelection, isOpen, networkIds, openDrawer]);

  const flowProps = useMemo<Omit<ModularDrawerFlowProps, "children">>(
    () => ({
      areCurrenciesFiltered,
      assetsConfiguration,
      currencies: preselectedCurrencies,
      isOpen: isModularDrawerOpen,
      networksConfiguration,
      onAccountSelected: handleAccountSelected,
      onClose: closeDrawer,
      onCurrencySelected: handleCurrencySelected,
      uiUseCase,
      useCase,
    }),
    [
      areCurrenciesFiltered,
      assetsConfiguration,
      closeDrawer,
      handleAccountSelected,
      handleCurrencySelected,
      isModularDrawerOpen,
      networksConfiguration,
      preselectedCurrencies,
      uiUseCase,
      useCase,
    ],
  );

  return { flowProps };
}
