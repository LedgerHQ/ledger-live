// @flow

import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { RefreshControl } from "react-native";
import { createStructuredSelector } from "reselect";
import type { AsyncState } from "../reducers/bridgeSync";
import { globalSyncStateSelector } from "../reducers/bridgeSync";
import { BridgeSyncConsumer } from "../bridge/BridgeSyncContext";
import CounterValues from "../countervalues";

const mapStateToProps = createStructuredSelector({
  globalSyncState: globalSyncStateSelector,
});

const Connector = (Decorated: React$ComponentType<any>) => {
  const SyncIndicator = ({
    globalSyncState,
    ...rest
  }: {
    globalSyncState: AsyncState,
  }) => (
    <BridgeSyncConsumer>
      {setSyncBehavior => (
        <CounterValues.PollingConsumer>
          {cvPolling => (
            <Decorated
              cvPoll={cvPolling.poll}
              setSyncBehavior={setSyncBehavior}
              {...rest}
            />
          )}
        </CounterValues.PollingConsumer>
      )}
    </BridgeSyncConsumer>
  );

  return connect(mapStateToProps)(SyncIndicator);
};

type Props = {
  error: ?Error,
  isPending: boolean,
  isError: boolean,
  cvPoll: *,
  setSyncBehavior: *,
  forwardedRef?: *,
};

export default (ScrollListLike: any) => {
  class Inner extends PureComponent<Props, { refreshing: boolean }> {
    state = {
      refreshing: false,
    };

    timeout: *;

    componentWillUnmount() {
      clearTimeout(this.timeout);
    }

    onRefresh = () => {
      this.props.cvPoll();
      this.props.setSyncBehavior({
        type: "SYNC_ALL_ACCOUNTS",
        priority: 5,
      });
      this.setState({ refreshing: true }, () => {
        this.timeout = setTimeout(() => {
          this.setState({ refreshing: false });
        }, 100);
      });
    };

    render() {
      const {
        isPending,
        error,
        isError,
        cvPoll,
        setSyncBehavior,
        forwardedRef,
        ...props
      } = this.props;
      const { refreshing } = this.state;
      return (
        <ScrollListLike
          {...props}
          ref={forwardedRef}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this.onRefresh}
            />
          }
        />
      );
    }
  }

  return Connector(Inner);
};
