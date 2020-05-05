// @flow

import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  useBridgeSync,
  useGlobalSyncState,
} from "@ledgerhq/live-common/lib/bridge/react";
import { isUpToDateSelector } from "../reducers/accounts";
import CounterValues from "../countervalues";

export default (Decorated: React$ComponentType<any>) =>
  function SyncIndicator(props: any) {
    const isUpToDate = useSelector(isUpToDateSelector);
    const globalSyncState = useGlobalSyncState();
    const setSyncBehavior = useBridgeSync();
    const { t } = useTranslation();
    const cvPolling = useContext(CounterValues.PollingContext);

    return (
      <Decorated
        isUpToDate={isUpToDate}
        isPending={cvPolling.pending || globalSyncState.pending}
        error={globalSyncState.error}
        cvPoll={cvPolling.poll}
        setSyncBehavior={setSyncBehavior}
        t={t}
        {...props}
      />
    );
  };
