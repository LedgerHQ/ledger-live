// @flow

import React from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { translate } from "react-i18next";
import { compose } from "redux";

import {
  useBridgeSync,
  useGlobalSyncState,
} from "@ledgerhq/live-common/lib/bridge/react";
import { isUpToDateSelector } from "../reducers/accounts";
import CounterValues from "../countervalues";

const mapStateToProps = createStructuredSelector({
  isUpToDate: isUpToDateSelector,
});

export default (Decorated: React$ComponentType<any>) => {
  const SyncIndicator = ({ isUpToDate, ...rest }: { isUpToDate: boolean }) => {
    const globalSyncState = useGlobalSyncState();
    const setSyncBehavior = useBridgeSync();
    return (
      <CounterValues.PollingConsumer>
        {cvPolling => {
          const isPending = cvPolling.pending || globalSyncState.pending;
          const error = globalSyncState.error;
          return (
            <Decorated
              isUpToDate={isUpToDate}
              isPending={isPending}
              error={error}
              cvPoll={cvPolling.poll}
              setSyncBehavior={setSyncBehavior}
              {...rest}
            />
          );
        }}
      </CounterValues.PollingConsumer>
    );
  };

  return compose(
    connect(mapStateToProps),
    translate(),
  )(SyncIndicator);
};
