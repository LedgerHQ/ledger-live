import { useMemo } from "react";
import { ContactCurrencyIdSchema, type ContactAddress } from "@domain/entity-contact";
import type { ContactsCurrencySelectionPort } from "@features/flow-contacts";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import {
  type OpenCurrencyFlow,
  useOpenCurrencyFlow,
} from "../../ModularDialog/hooks/useOpenCurrencyFlow";

function resolveContactCurrencyId(
  currency: CryptoOrTokenCurrency | null,
): ContactAddress["currencyId"] | null {
  const parsedCurrencyId = ContactCurrencyIdSchema.safeParse(currency?.id);
  return parsedCurrencyId.success ? parsedCurrencyId.data : null;
}

function createCurrencySelectionPort(
  openCurrencyFlow: OpenCurrencyFlow,
): ContactsCurrencySelectionPort {
  return {
    selectCurrency: async networkIds =>
      resolveContactCurrencyId(await openCurrencyFlow(networkIds)),
  };
}

export function useContactsCurrencySelectionAdapter(): ContactsCurrencySelectionPort {
  const { openCurrencyFlow } = useOpenCurrencyFlow();

  return useMemo(() => createCurrencySelectionPort(openCurrencyFlow), [openCurrencyFlow]);
}
