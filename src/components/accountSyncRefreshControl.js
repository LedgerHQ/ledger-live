// @flow

import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { RefreshControl } from "react-native";
import { createStructuredSelector } from "reselect";
import type { BehaviorAction } from "../bridge/BridgeSyncContext";
import type { AsyncState } from "../reducers/bridgeSync";
import { accountSyncStateSelector } from "../reducers/bridgeSync";
import { BridgeSyncConsumer } from "../bridge/BridgeSyncContext";

const mapStateToProps = createStructuredSelector({
  accountSyncState: accountSyncStateSelector,
});

const Connector = (Decorated: React$ComponentType<any>) => {
  const SyncIndicator = ({
    accountSyncState,
    ...rest
  }: {
    accountSyncState: AsyncState,
  }) => (
    <BridgeSyncConsumer>
      {setSyncBehavior => {
        const isPending = accountSyncState.pending;
        return (
          <Decorated
            isPending={isPending}
            setSyncBehavior={setSyncBehavior}
            {...rest}
          />
        );
      }}
    </BridgeSyncConsumer>
  );

  return connect(mapStateToProps)(SyncIndicator);
};

type Props = {
  error: ?Error,
  isPending: boolean,
  isError: boolean,
  accountId: string,
  cvPoll: *,
  setSyncBehavior: *,
  forwardedRef?: *,
  provideSyncRefreshControlBehavior?: BehaviorAction,
};

export default (ScrollListLike: any) => {
  class Inner extends PureComponent<
    Props,
    {
      lastClickTime: number,
      refreshing: boolean,
    },
  > {
    state = {
      lastClickTime: 0,
      refreshing: false,
    };

    timeout: *;

    componentWillUnmount() {
      clearTimeout(this.timeout);
    }

    onPress = () => {
      const { setSyncBehavior, accountId } = this.props;
      setSyncBehavior({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: 10,
      });
      this.setState({ lastClickTime: Date.now(), refreshing: true }, () => {
        this.timeout = setTimeout(() => {
          this.setState({ refreshing: false });
        }, 100);
      });
    };

    render() {
      const {
        accountId,
        isPending,
        error,
        isError,
        setSyncBehavior,
        forwardedRef,
        ...props
      } = this.props;
      const { refreshing } = this.state;
      const { lastClickTime } = this.state;
      const isUserClick = Date.now() - lastClickTime < 1000;
      const isLoading = (isPending && isUserClick) || refreshing;
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
