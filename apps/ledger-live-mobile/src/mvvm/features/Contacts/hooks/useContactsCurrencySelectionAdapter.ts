import { useMemo } from "react";
import { ContactCurrencyIdSchema, type ContactAddress } from "@domain/entity-contact";
import type { ContactsCurrencySelectionPort } from "@features/flow-contacts";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { ScreenName } from "~/const";
import { useModularDrawerController } from "LLM/features/ModularDrawer";

type OpenModularDrawer = ReturnType<typeof useModularDrawerController>["openDrawer"];

function resolveContactCurrencyId(
  currency: CryptoOrTokenCurrency | null,
): ContactAddress["currencyId"] | null {
  const parsedCurrencyId = ContactCurrencyIdSchema.safeParse(currency?.id);
  return parsedCurrencyId.success ? parsedCurrencyId.data : null;
}

function selectCurrency(
  openDrawer: OpenModularDrawer,
  networkIds: Parameters<ContactsCurrencySelectionPort["selectCurrency"]>[0],
): Promise<ContactAddress["currencyId"] | null> {
  return new Promise(resolve => {
    const onCurrencySelected = (currency: CryptoOrTokenCurrency | null) => {
      resolve(resolveContactCurrencyId(currency));
    };

    openDrawer({
      currencies: [...networkIds],
      areCurrenciesFiltered: true,
      completionMode: "currency",
      enableAccountSelection: false,
      flow: "contacts_add_address",
      source: ScreenName.MyWalletContactDetail,
      onCurrencySelected,
    });
  });
}

function createCurrencySelectionPort(openDrawer: OpenModularDrawer): ContactsCurrencySelectionPort {
  return {
    selectCurrency: networkIds => selectCurrency(openDrawer, networkIds),
  };
}

export function useContactsCurrencySelectionAdapter(): ContactsCurrencySelectionPort {
  const { openDrawer } = useModularDrawerController();

  return useMemo(() => createCurrencySelectionPort(openDrawer), [openDrawer]);
}
