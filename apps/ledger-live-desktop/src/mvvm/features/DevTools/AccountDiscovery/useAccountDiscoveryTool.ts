import { useCallback, useMemo } from "react";
import { useAccountDiscoveryToolState } from "@devtools/bindings";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { addAccountsAction, sameAccountIdentity } from "@ledgerhq/live-common/account/addAccounts";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import {
  completeOnSession,
  deriveOnSession,
  heldAccountMatcher,
  legacyScanRules,
  needsCompletion,
  placeholderAccount,
  placeholderUnsupportedReason,
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
      const scannedAccounts = await Promise.all(
        descriptors.map(descriptor => placeholderAccount(descriptor)),
      );
      const existingAccounts = accountsSelector(store.getState());
      const newAccounts = scannedAccounts.filter(
        scanned => !existingAccounts.some(existing => sameAccountIdentity(existing, scanned)),
      );
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts: newAccounts,
          selectedIds: newAccounts.map(({ id }) => id),
          renamings: {},
        }),
      );
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
    notAddableReason: placeholderUnsupportedReason,
    addAccounts,
  });
}
