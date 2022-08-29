import React, { useEffect, useState } from "react";
import { RefreshControl } from "react-native";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-common/countervalues/react";
import { useTheme } from "@react-navigation/native";
import { SYNC_DELAY } from "../constants";

type Props = {
  error?: Error;
  isError: boolean;
  forwardedRef?: any;
  setSyncBehavior: any;
};
export default (ScrollListLike: any) => {
  function Inner({ forwardedRef, ...scrollListLikeProps }: Props) {
    const { colors, dark } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const setSyncBehavior = useBridgeSync();
    const { poll } = useCountervaluesPolling();

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
        {...scrollListLikeProps}
        ref={forwardedRef}
        refreshControl={
          <RefreshControl
            progressBackgroundColor={dark ? colors.background : colors.card}
            colors={[colors.live]}
            tintColor={colors.live}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    );
  }

  // $FlowFixMe
  return React.forwardRef((props, ref) => (
    <Inner {...props} forwardedRef={ref} />
  ));
};
