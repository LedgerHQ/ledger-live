import React, { useCallback } from "react";
import { BridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector, useDispatch } from "react-redux";
import logger from "../logger";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { track } from "~/analytics/segment";
import { prepareCurrency, hydrateCurrency } from "./cache";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DdRum, RumActionType } from "@datadog/mobile-react-native";
import { DD_ACCOUNT_SYNC_ACTION } from "~/utils/constants";

export const BridgeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const datadogFF = useFeature("llmDatadog");
  const dispatch = useDispatch();
  const updateAccount = useCallback(
    (accountId: string, updater: (arg0: Account) => Account) =>
      dispatch(updateAccountWithUpdater({ accountId, updater })),
    [dispatch],
  );
  const recoverError = useCallback((error: Error) => {
    logger.critical(error);
  }, []);
  return (
    <BridgeSync
      accounts={accounts}
      updateAccountWithUpdater={updateAccount}
      recoverError={recoverError}
      trackAnalytics={(event, properties, mandatory) => {
        track(event, properties, mandatory);
        if(datadogFF?.enabled) {
          DdRum.addAction(RumActionType.CUSTOM, DD_ACCOUNT_SYNC_ACTION, { event: properties });
        }
      }}
      prepareCurrency={prepareCurrency}
      hydrateCurrency={hydrateCurrency}
      blacklistedTokenIds={blacklistedTokenIds}
    >
      {children}
    </BridgeSync>
  );
};