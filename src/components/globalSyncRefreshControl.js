// @flow

import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { RefreshControl } from "react-native";
import { createStructuredSelector } from "reselect";
import type { BehaviorAction } from "../bridge/BridgeSyncContext";
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
          {cvPolling => {
            const isPending = cvPolling.pending || globalSyncState.pending;
            return (
              <Decorated
                isPending={isPending}
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

type Props = {
  error: ?Error,
  isPending: boolean,
  isError: boolean,
  cvPoll: *,
  setSyncBehavior: *,
  forwardedRef?: *,
  provideSyncRefreshControlBehavior?: BehaviorAction,
};

export default (ScrollListLike: any) => {
  class Inner extends PureComponent<Props, { lastClickTime: number }> {
    state = {
      lastClickTime: 0,
    };

    onPress = () => {
      this.props.cvPoll();
      this.props.setSyncBehavior(
        this.props.provideSyncRefreshControlBehavior || {
          type: "SYNC_ALL_ACCOUNTS",
          priority: 5,
        },
      );
      this.setState({ lastClickTime: Date.now() });
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
      const { lastClickTime } = this.state;
      const isUserClick = Date.now() - lastClickTime < 1000;
      const isLoading = isPending && isUserClick;
      return (
        <ScrollListLike
          {...props}
          ref={forwardedRef}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={this.onPress} />
          }
        />
      );
    }
  }

  return Connector(Inner);
};
