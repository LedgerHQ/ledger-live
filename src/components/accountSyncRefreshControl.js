// @flow

import React, { PureComponent } from "react";
import { RefreshControl } from "react-native";
import type { Sync } from "@ledgerhq/live-common/lib/bridge/react/types";
import {
  useBridgeSync,
  useAccountSyncState,
} from "@ledgerhq/live-common/lib/bridge/react";
import CounterValues from "../countervalues";
import { SYNC_DELAY } from "../constants";

const Connector = (Decorated: React$ComponentType<any>) => {
  const SyncIndicator = (rest: *) => {
    const accountSyncState = useAccountSyncState({ accountId: rest.accountId });
    const setSyncBehavior = useBridgeSync();
    const isPending = accountSyncState.pending;
    return (
      <CounterValues.PollingConsumer>
        {cvPolling => (
          <Decorated
            cvPoll={cvPolling.poll}
            isPending={isPending}
            setSyncBehavior={setSyncBehavior}
            {...rest}
          />
        )}
      </CounterValues.PollingConsumer>
    );
  };

  return SyncIndicator;
};

type Props = {
  error: ?Error,
  isPending: boolean,
  isError: boolean,
  accountId: string,
  cvPoll: *,
  setSyncBehavior: *,
  forwardedRef?: *,
  provideSyncRefreshControlBehavior?: Sync,
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
      this.props.cvPoll();
      setSyncBehavior({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: 10,
      });
      this.setState({ lastClickTime: Date.now(), refreshing: true }, () => {
        this.timeout = setTimeout(() => {
          this.setState({ refreshing: false });
        }, SYNC_DELAY);
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
