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
      resolveContactCurrencyId(await openCurrencyFlow(networkIds, { presentation: "embedded" })),
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
