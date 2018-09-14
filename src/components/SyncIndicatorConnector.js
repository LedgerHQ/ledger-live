// @flow

import React from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";

import type { AsyncState } from "../reducers/bridgeSync";
import { globalSyncStateSelector } from "../reducers/bridgeSync";
import { isUpToDateSelector } from "../reducers/accounts";
import { BridgeSyncConsumer } from "../bridge/BridgeSyncContext";
import CounterValues from "../countervalues";

const mapStateToProps = createStructuredSelector({
  globalSyncState: globalSyncStateSelector,
  isUpToDate: isUpToDateSelector,
});

export default (Inner: React$ComponentType<any>) => {
  const SyncIndicator = ({
    globalSyncState,
    isUpToDate,
    ...rest
  }: {
    globalSyncState: AsyncState,
    isUpToDate: boolean,
  }) => (
    <BridgeSyncConsumer>
      {setSyncBehavior => (
        <CounterValues.PollingConsumer>
          {cvPolling => {
            const isPending = cvPolling.pending || globalSyncState.pending;
            const isError =
              !isPending && (cvPolling.error || globalSyncState.error);
            return (
              <Inner
                isUpToDate={isUpToDate}
                isPending={isPending}
                isError={!!isError && !isUpToDate} // we only show error if it's not up to date. this hide a bit error that happen from time to time
                error={isError ? globalSyncState.error : null}
                cvPoll={cvPolling.poll}
                setSyncBehavior={setSyncBehavior}
                {...rest}
              />
            );
          }}
        </CounterValues.PollingConsumer>
      )}
    </BridgeSyncConsumer>
  );

  return connect(mapStateToProps)(SyncIndicator);
};
