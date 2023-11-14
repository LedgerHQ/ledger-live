import React, { useCallback } from "react";
import { BridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector, useDispatch } from "react-redux";
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { recentlyChangedExperimental } from "~/renderer/experimental";
import { recentlyKilledInternalProcess } from "~/renderer/reset";
import { track } from "~/renderer/analytics/segment";
import { prepareCurrency, hydrateCurrency } from "./cache";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { Account } from "@ledgerhq/types-live";
export const BridgeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const dispatch = useDispatch();
  const updateAccount = useCallback(
    (accountId: string, updater: (a: Account) => Account) =>
      dispatch(updateAccountWithUpdater(accountId, updater)),
    [dispatch],
  );
  const recoverError = useCallback((error: Error) => {
    const isInternalProcessError = error && error.message.includes("Internal process error");
    if (
      isInternalProcessError &&
      (recentlyKilledInternalProcess() || recentlyChangedExperimental())
    ) {
      // This error is normal because the thread was recently killed. we silent it for the user.
      return;
    }
    logger.critical(error);
    return error;
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
