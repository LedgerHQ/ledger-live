import { useMemo } from "react";
import { useAccountDiscoveryToolState } from "@devtools/bindings";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { deriveOnSession, legacyScanRules } from "~/config/account-data-setup";
import { accountDiscoveryIntentLWDDefinition } from "./accountDiscoveryIntentLWDDefinition";

export function useAccountDiscoveryTool() {
  const currencies = useMemo(
    () =>
      listSupportedCurrencies().map(({ id, name }) => ({
        id: CryptoCurrencyIdSchema.parse(id),
        name,
      })),
    [],
  );
  return useAccountDiscoveryToolState({
    currencies,
    intentDefinition: accountDiscoveryIntentLWDDefinition,
    createDerive: deriveOnSession,
    scanRules: legacyScanRules,
  });
}
