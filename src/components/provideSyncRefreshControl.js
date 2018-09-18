// @flow

import React, { PureComponent } from "react";
import { RefreshControl } from "react-native";
import SyncIndicatorConnector from "./SyncIndicatorConnector";
import type { BehaviorAction } from "../bridge/BridgeSyncContext";

type Props = {
  error: ?Error,
  isPending: boolean,
  isError: boolean,
  isUpToDate: boolean,
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
        isUpToDate,
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

  return SyncIndicatorConnector(Inner);
};
