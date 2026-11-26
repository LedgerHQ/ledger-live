import { useCallback, useMemo } from "react";
import { useAccountDiscoveryToolState } from "@devtools/bindings";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { addAccountsAction } from "@ledgerhq/live-common/account/addAccounts";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import {
  completeOnSession,
  deriveOnSession,
  heldAccountMatcher,
  legacyScanRules,
  needsCompletion,
  syncDiscoveredAccount,
} from "~/config/account-data-setup";
import { accountsSelector } from "~/renderer/reducers/accounts";
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
  const accounts = useSelector(accountsSelector);
  const currencies = useMemo(
    () =>
      listSupportedCurrencies().map(({ id, name }) => ({
        id: CryptoCurrencyIdSchema.parse(id),
        name,
      })),
    [],
  );
  const isAdded = useMemo(() => heldAccountMatcher(accounts), [accounts]);

  const addAccounts = useCallback(
    async (descriptors: readonly AccountDescriptor[]) => {
      const results = await Promise.allSettled(
        descriptors.map(descriptor => syncDiscoveredAccount(descriptor, store.getState)),
      );
      const scannedAccounts = results.flatMap(result =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      const existingAccounts = accountsSelector(store.getState());
      const isHeld = heldAccountMatcher(existingAccounts);
      const newAccounts = scannedAccounts.filter(account => {
        try {
          return !isHeld(fromLegacyAccount(account));
        } catch {
          return true;
        }
      });
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts: newAccounts,
          selectedIds: newAccounts.map(({ id }) => id),
          renamings: {},
        }),
      );
      const failures = results.flatMap(result =>
        result.status === "rejected" ? [result.reason] : [],
      );
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} of ${descriptors.length} not synced: ${failures.map(String).join("; ")}`,
        );
      }
    },
    [dispatch, store],
  );

  return useAccountDiscoveryToolState({
    currencies,
    intentDefinition: accountDiscoveryIntentLWDDefinition,
    createDerive: deriveOnSession,
    scanRules: legacyScanRules,
    completion,
    isAdded,
    addAccounts,
  });
}
