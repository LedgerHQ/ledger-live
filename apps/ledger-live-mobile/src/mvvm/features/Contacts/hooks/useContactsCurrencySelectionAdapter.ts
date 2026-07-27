import { useMemo } from "react";
import { ContactCurrencyIdSchema, type ContactAddress } from "@domain/entity-contact";
import type { ContactsCurrencySelectionPort } from "@features/flow-contacts";
import { ScreenName } from "~/const";
import { useModularDrawerController } from "LLM/features/ModularDrawer";

export function useContactsCurrencySelectionAdapter(): ContactsCurrencySelectionPort {
  const { openDrawer } = useModularDrawerController();

  return useMemo(
    () => ({
      selectCurrency: networkIds =>
        new Promise<ContactAddress["currencyId"] | null>(resolve => {
          openDrawer({
            currencies: [...networkIds],
            areCurrenciesFiltered: true,
            completionMode: "currency",
            enableAccountSelection: false,
            flow: "contacts_add_address",
            source: ScreenName.MyWalletContactDetail,
            onCurrencySelected: currency => {
              const parsedCurrencyId = ContactCurrencyIdSchema.safeParse(currency?.id);
              resolve(parsedCurrencyId.success ? parsedCurrencyId.data : null);
            },
          });
        }),
    }),
    [openDrawer],
  );
}
