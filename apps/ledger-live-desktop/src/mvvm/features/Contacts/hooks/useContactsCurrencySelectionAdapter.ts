import { useMemo } from "react";
import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import type {
  AddAddressCurrencySelection,
  ContactsCurrencySelectionPort,
} from "@features/flow-contacts";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import {
  type OpenCurrencyFlow,
  useOpenCurrencyFlow,
} from "../../ModularDialog/hooks/useOpenCurrencyFlow";

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
        await openCurrencyFlow(networkIds, { presentation: "embedded" }),
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
