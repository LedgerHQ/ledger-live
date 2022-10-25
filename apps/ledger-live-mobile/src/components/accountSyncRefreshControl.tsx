import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useTheme } from "@react-navigation/native";
import {
  useBridgeSync,
  useAccountSyncState,
} from "@ledgerhq/live-common/bridge/react/index";
import type { Sync } from "@ledgerhq/live-common/bridge/react/types";
import { useCountervaluesPolling } from "@ledgerhq/live-common/countervalues/react";
import { SYNC_DELAY } from "../constants";

type Props = {
  error: Error | null | undefined;
  isError: boolean;
  accountId: string;
  forwardedRef?: any;
  provideSyncRefreshControlBehavior?: Sync;
};
export default (ScrollListLike: any) => {
  function Inner({
    accountId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isError,
    forwardedRef,
    ...scrollListLikeProps
  }: Props) {
    const { pending: isPending } = useAccountSyncState({
      accountId,
    });
    const { colors, dark } = useTheme();
    const setSyncBehavior = useBridgeSync();
    const { poll } = useCountervaluesPolling();
    const [lastClickTime, setLastClickTime] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    function onPress() {
      poll();
      setSyncBehavior({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: 10,
        reason: "user-pull-to-refresh-one-account",
      });
      setLastClickTime(Date.now());
      setRefreshing(true);
    }

    useEffect(() => {
      if (!refreshing) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      }

      const timer = setTimeout(() => {
        setRefreshing(false);
      }, SYNC_DELAY);
      return () => {
        clearTimeout(timer);
      };
    }, [refreshing]);
    const isUserClick = useMemo(
      () => Date.now() - lastClickTime < 1000,
      [lastClickTime],
    );
    const isLoading = (isPending && isUserClick) || refreshing;
    return (
      <ScrollListLike
        {...scrollListLikeProps}
        ref={forwardedRef}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onPress}
            progressBackgroundColor={dark ? colors.background : colors.card}
            colors={[colors.live]}
            tintColor={colors.live}
          />
        }
      />
    );
  }

  // $FlowFixMe
  return React.forwardRef((prop, ref) => (
    <Inner {...prop} forwardedRef={ref} />
  ));
};
