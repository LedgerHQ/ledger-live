import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useBridgeSync, useAccountSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues/react";
import { SYNC_DELAY } from "~/utils/constants";

export interface Props {
  accountId?: string;
  error?: Error | null;
  isError?: boolean;
  forwardedRef?: React.Ref<unknown>;
}

export default <P,>(ScrollListLike: React.ComponentType<P>) => {
  function Inner({ accountId, error, isError, forwardedRef, ...scrollListLikeProps }: P & Props) {
    const { pending: isPending } = useAccountSyncState({
      accountId,
    });
    const { colors, dark } = useTheme();
    const setSyncBehavior = useBridgeSync();
    const { poll } = useCountervaluesPolling();
    const [lastClickTime, setLastClickTime] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    function onPress() {
      if (!accountId) return;
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
    const isUserClick = useMemo(() => Date.now() - lastClickTime < 1000, [lastClickTime]);
    const isLoading = (isPending && isUserClick) || refreshing;
    return (
      <ScrollListLike
        {...(scrollListLikeProps as P)}
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

  return React.forwardRef((prop: P & Props, ref) => <Inner {...prop} forwardedRef={ref} />);
};
