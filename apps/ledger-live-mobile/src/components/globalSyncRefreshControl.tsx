import React, { useEffect, useState } from "react";
import { RefreshControl, RefreshControlProps } from "react-native";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-common/countervalues/react";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { SYNC_DELAY } from "~/utils/constants";

type Props = {
  error?: Error;
  isError?: boolean;
  forwardedRef?: React.Ref<unknown>;
};
export default <P,>(
  ScrollListLike: React.ComponentType<P>,
  refreshControlprops?: Partial<RefreshControlProps>,
) => {
  function Inner({ forwardedRef, ...scrollListLikeProps }: Props & P) {
    const { colors, dark } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const setSyncBehavior = useBridgeSync();
    const { poll } = useCountervaluesPolling();
    const IsFocused = useIsFocused();
    function onRefresh() {
      poll();
      setSyncBehavior({
        type: "SYNC_ALL_ACCOUNTS",
        priority: 5,
        reason: "user-pull-to-refresh",
      });
      setRefreshing(true);
    }

    useEffect(() => {
      setRefreshing(false);
    }, [IsFocused]);

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

    return (
      <ScrollListLike
        {...(scrollListLikeProps as P)}
        ref={forwardedRef}
        refreshControl={
          <RefreshControl
            progressBackgroundColor={dark ? colors.background : colors.card}
            colors={[colors.live]}
            tintColor={colors.live}
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...refreshControlprops}
          />
        }
      />
    );
  }

  return React.forwardRef((props: P & Props, ref) => <Inner {...props} forwardedRef={ref} />);
};
