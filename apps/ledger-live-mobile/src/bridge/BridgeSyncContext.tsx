import { track } from "@shared/analytics";
import React, { useCallback } from "react";
import { BridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector, useDispatch } from "~/context/hooks";
import logger from "../logger";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { prepareCurrency, hydrateCurrency } from "./cache";
import { Account } from "@ledgerhq/types-live";

export const BridgeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const dispatch = useDispatch();
  const updateAccount = useCallback(
    (accountId: string, updater: (arg0: Account) => Account) =>
      dispatch(updateAccountWithUpdater({ accountId, updater })),
    [dispatch],
  );
  const recoverError = useCallback((error: Error) => {
    logger.critical(error);
  }, []);
  const trackAnalytics = useCallback<React.ComponentProps<typeof BridgeSync>["trackAnalytics"]>(
    (event, properties, mandatory) => {
      void track(event, properties, mandatory ? { mandatory: true } : undefined);
    },
    [],
  );
  return (
    <BridgeSync
      accounts={accounts}
      updateAccountWithUpdater={updateAccount}
      recoverError={recoverError}
      trackAnalytics={trackAnalytics}
      prepareCurrency={prepareCurrency}
      hydrateCurrency={hydrateCurrency}
      blacklistedTokenIds={blacklistedTokenIds}
    >
      {children}
    </BridgeSync>
  );
};
