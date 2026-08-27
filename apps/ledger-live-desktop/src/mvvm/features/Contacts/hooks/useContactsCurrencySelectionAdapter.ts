import { useMemo } from "react";
import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import type {
  AddAddressCurrencySelection,
  ContactsCurrencySelectionPort,
} from "@features/flow-contacts-add-address";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  type OpenCurrencyFlow,
  useOpenCurrencyFlow,
} from "../../ModularDialog/hooks/useOpenCurrencyFlow";

const CONTACTS_CURRENCY_SELECTION_CONFIGURATION: EnhancedModularDrawerConfiguration = {
  assets: { leftElement: "undefined", rightElement: "undefined" },
  networks: { leftElement: "undefined", rightElement: "undefined" },
};

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

function createCurrencySelectionPort(
  openCurrencyFlow: OpenCurrencyFlow,
): ContactsCurrencySelectionPort {
  return {
    selectCurrency: async networkIds =>
      resolveContactCurrencySelection(
        await openCurrencyFlow(networkIds, {
          dialogConfiguration: CONTACTS_CURRENCY_SELECTION_CONFIGURATION,
          presentation: "embedded",
        }),
      ),
  };
}

export type ContactsCurrencySelectionAdapter = ContactsCurrencySelectionPort &
  Readonly<{
    cancelCurrencySelection: () => void;
  }>;

export function useContactsCurrencySelectionAdapter(): ContactsCurrencySelectionAdapter {
  const { openCurrencyFlow, cancelCurrencyFlow } = useOpenCurrencyFlow();

  const currencySelection = useMemo(
    () => createCurrencySelectionPort(openCurrencyFlow),
    [openCurrencyFlow],
  );

  return { ...currencySelection, cancelCurrencySelection: cancelCurrencyFlow };
}
