import { useMemo } from "react";
import { useAccountDiscoveryToolState } from "@devtools/bindings";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { deriveOnSession, legacyScanRules } from "~/config/account-data-setup";
import { accountDiscoveryIntentLWDDefinition } from "./accountDiscoveryIntentLWDDefinition";

/** Binds the account discovery devtool to the desktop Device Intent definition and the session derivation. */
export function useAccountDiscoveryTool() {
  const currencies = useMemo(
    () => listSupportedCurrencies().map(({ id, name }) => ({ id, name })),
    [],
  );
  return useAccountDiscoveryToolState({
    currencies,
    intentDefinition: accountDiscoveryIntentLWDDefinition,
    createDerive: deriveOnSession,
    scanRules: legacyScanRules,
  });
}
