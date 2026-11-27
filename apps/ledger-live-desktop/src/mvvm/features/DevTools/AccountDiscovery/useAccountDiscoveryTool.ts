import { useCallback, useMemo } from "react";
import { useAccountDiscoveryToolState, type AccountDiscoveryInputs } from "@devtools/bindings";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { useDispatch, useStore } from "LLD/hooks/redux";
import {
  addDiscoveredAccounts,
  completeOnSession,
  deriveOnSession,
  legacyScanRules,
  needsCompletion,
} from "~/config/account-data-setup";
import { accountCompletionIntentLWDDefinition } from "./accountCompletionIntentLWDDefinition";
import { accountDiscoveryIntentLWDDefinition } from "./accountDiscoveryIntentLWDDefinition";

const completion = {
  intentDefinition: accountCompletionIntentLWDDefinition,
  createComplete: completeOnSession,
  needsCompletion,
};

export function useAccountDiscoveryTool() {
  const dispatch = useDispatch();
  const store = useStore();
  const currencies = useMemo(
    () =>
      listSupportedCurrencies().map(({ id, name }) => ({
        id: CryptoCurrencyIdSchema.parse(id),
        name,
      })),
    [],
  );
  const addAccounts = useCallback<AccountDiscoveryInputs["addAccounts"]>(
    accounts => addDiscoveredAccounts(accounts, store.getState, dispatch),
    [dispatch, store],
  );
  return useAccountDiscoveryToolState({
    currencies,
    intentDefinition: accountDiscoveryIntentLWDDefinition,
    createDerive: deriveOnSession,
    scanRules: legacyScanRules,
    completion,
    addAccounts,
  });
}
