// @flow

import React, { useContext, useEffect, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import {
  useBridgeSync,
  useAccountSyncState,
} from "@ledgerhq/live-common/lib/bridge/react";
import type { Sync } from "@ledgerhq/live-common/lib/bridge/react/types";
import CounterValues from "../countervalues";
import { SYNC_DELAY } from "../constants";

type Props = {
  error: ?Error,
  isError: boolean,
  accountId: string,
  forwardedRef?: any,
  provideSyncRefreshControlBehavior?: Sync,
};

export default (ScrollListLike: any) => {
  function Inner({
    accountId,
    error,
    isError,
    forwardedRef,
    ...scrollListLikeProps
  }: Props) {
    const { pending: isPending } = useAccountSyncState({ accountId });
    const setSyncBehavior = useBridgeSync();
    const { poll: cvPoll } = useContext(CounterValues.PollingContext);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    function onPress() {
      cvPoll();
      setSyncBehavior({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: 10,
      });
      setLastClickTime(Date.now());
      setRefreshing(true);
    }

    useEffect(() => {
      if (!refreshing) {
        return () => {};
      }

      const timer = setTimeout(() => {
        setRefreshing(false);
      }, SYNC_DELAY);

      return () => {
        clearTimeout(timer);
      };
    }, [refreshing]);

    const isUserClick = useMemo(() => Date.now() - lastClickTime < 1000, [
      lastClickTime,
    ]);
    const isLoading = (isPending && isUserClick) || refreshing;

    return (
      <ScrollListLike
        {...scrollListLikeProps}
        ref={forwardedRef}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onPress} />
        }
      />
    );
  }

  // $FlowFixMe
  return React.forwardRef((prop, ref) => (
    <Inner {...prop} forwardedRef={ref} />
  ));
};
