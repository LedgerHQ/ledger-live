import React, { useCallback, useEffect, useRef } from "react";
import { BridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector, useDispatch } from "~/context/hooks";
import logger from "../logger";
import { updateAccountsWithUpdaters } from "~/actions/accounts";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { track } from "~/analytics/segment";
import { prepareCurrency, hydrateCurrency } from "./cache";
import { Account } from "@ledgerhq/types-live";
import type { AccountsUpdateAccountWithUpdaterPayload } from "~/actions/types";

// Debounce window for coalescing per-account sync updaters into one batched
// Redux dispatch. A sync wave emits one updater per account (100 accounts =
// 100 calls); without this, each call rebuilds the whole accounts array and
// invalidates every all-accounts selector (N array rebuilds + N invalidation
// waves per wave). ~100ms reflects no user-visible lag and stays far below
// the 10s pending-operations loop.
// ponytail: ceil = coalescing within a window only — a blocked JS thread still
//  delays the flush (dispatch happens on a timer). Upgrade path: flush on
//  requestIdleCallback / 16ms frame budget when sync waves saturate the thread.
const ACCOUNT_UPDATE_BATCH_DEBOUNCE_MS = 100;

export const BridgeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const dispatch = useDispatch();

  const pendingUpdates = useRef<AccountsUpdateAccountWithUpdaterPayload[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    const updates = pendingUpdates.current;
    pendingUpdates.current = [];
    if (updates.length > 0) {
      dispatch(updateAccountsWithUpdaters({ updates }));
    }
  }, [dispatch]);

  useEffect(() => () => flush(), [flush]);

  const updateAccount = useCallback(
    (accountId: string, updater: (arg0: Account) => Account) => {
      // Coalesce updaters during the debounce window; the flush is the only
      // place that touches Redux, so a single sync wave becomes one dispatch.
      pendingUpdates.current.push({ accountId, updater });
      if (flushTimer.current) return;
      flushTimer.current = setTimeout(flush, ACCOUNT_UPDATE_BATCH_DEBOUNCE_MS);
    },
    [flush],
  );

  const recoverError = useCallback((error: Error) => {
    logger.critical(error);
  }, []);
  return (
    <BridgeSync
      accounts={accounts}
      updateAccountWithUpdater={updateAccount}
      recoverError={recoverError}
      trackAnalytics={track}
      prepareCurrency={prepareCurrency}
      hydrateCurrency={hydrateCurrency}
      blacklistedTokenIds={blacklistedTokenIds}
    >
      {children}
    </BridgeSync>
  );
};
