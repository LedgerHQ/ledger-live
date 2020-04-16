// @flow

import React, { PureComponent } from "react";
import { RefreshControl } from "react-native";
import { useBridgeSync } from "@ledgerhq/live-common/lib/bridge/react";
import CounterValues from "../countervalues";
import { SYNC_DELAY } from "../constants";

const Connector = (Decorated: React$ComponentType<any>) => {
  const SyncIndicator = (rest: *) => {
    const setSyncBehavior = useBridgeSync();
    return (
      <CounterValues.PollingConsumer>
        {cvPolling => (
          <Decorated
            cvPoll={cvPolling.poll}
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
        }, SYNC_DELAY);
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
