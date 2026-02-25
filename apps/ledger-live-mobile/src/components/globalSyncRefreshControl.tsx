import React, { useEffect, useRef, useState } from "react";
import { RefreshControl, RefreshControlProps } from "react-native";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useIsFocused, useRoute, useTheme } from "@react-navigation/native";
import { SYNC_DELAY } from "~/utils/constants";
import { track } from "~/analytics";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";
import { useDispatch } from "~/context/hooks";
import { setRefreshStarted, setRefreshCompleted } from "~/reducers/portfolioRefresh";

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
  function Inner({
    forwardedRef,
    overrideRefreshControlProps,
    isError,
    ...scrollListLikeProps
  }: Props & P) {
    const { colors, dark } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const setSyncBehavior = useBridgeSync();
    const { onUserRefresh } = useWalletSyncUserState();
    const { poll } = useCountervaluesPolling();
    const IsFocused = useIsFocused();
    const dispatch = useDispatch();
    const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");
    const route = useRoute();
    const refreshingRef = useRef(refreshing);
    refreshingRef.current = refreshing;

    function onRefresh() {
      poll();
      setSyncBehavior({
        type: "SYNC_ALL_ACCOUNTS",
        priority: 5,
        reason: "user-pull-to-refresh",
      });
      setRefreshing(true);
      dispatch(setRefreshStarted());
      track("button_clicked", {
        button: "pull to refresh",
        page: route.name,
        triggered_after_sync_error: isError ?? false,
      });
      onUserRefresh();
    }

    useEffect(() => {
      if (!IsFocused && refreshingRef.current) {
        dispatch(setRefreshCompleted(Date.now()));
      }
      setRefreshing(false);
    }, [IsFocused, dispatch]);

    useEffect(() => {
      if (!refreshing) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      }

      const timer = setTimeout(() => {
        setRefreshing(false);
        dispatch(setRefreshCompleted(Date.now()));
      }, SYNC_DELAY);
      return () => {
        clearTimeout(timer);
      };
    }, [refreshing, dispatch]);

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
            colors={shouldDisplayBalanceRefreshRework ? ["transparent"] : [colors.live]}
            tintColor={shouldDisplayBalanceRefreshRework ? "transparent" : colors.live}
            refreshing={shouldDisplayBalanceRefreshRework ? false : refreshing}
            onRefresh={onRefresh}
            {...mergedRefreshControlProps}
          />
        }
      />
    );
  }

  return React.forwardRef<unknown, P & Props>((props, ref) => (
    <Inner {...({ ...props, forwardedRef: ref } as P & Props)} />
  ));
};
