import React, { useEffect, useState } from "react";
import { RefreshControl, RefreshControlProps } from "react-native";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { SYNC_DELAY } from "~/utils/constants";
import { track } from "~/analytics";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";

type Props = {
  error?: Error;
  isError?: boolean;
  forwardedRef?: React.Ref<unknown>;
  /** Override or extend refresh control options per render (e.g. progressViewOffset). Merged with defaultRefreshControlProps. */
  overrideRefreshControlProps?: Partial<RefreshControlProps>;
};
export default <P,>(
  ScrollListLike: React.ComponentType<P>,
  defaultRefreshControlProps?: Partial<RefreshControlProps>,
) => {
  function Inner({ forwardedRef, overrideRefreshControlProps, ...scrollListLikeProps }: Props & P) {
    const { colors, dark } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const setSyncBehavior = useBridgeSync();
    const { onUserRefresh } = useWalletSyncUserState();
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
      track("buttonClicked", { button: "pull to refresh" });
      onUserRefresh();
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

    const mergedRefreshControlProps = {
      ...defaultRefreshControlProps,
      ...overrideRefreshControlProps,
    };

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
            {...mergedRefreshControlProps}
          />
        }
      />
    );
  }

  return React.forwardRef<unknown, P & Props>((props, ref) => (
    // @ts-expect-error REACT19FIXME: Generic forwardRef type inference issue with spread props
    <Inner {...props} forwardedRef={ref} />
  ));
};
