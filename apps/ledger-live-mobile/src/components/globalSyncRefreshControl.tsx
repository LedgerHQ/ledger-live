import React, { useEffect, useRef, useState } from "react";
import { RefreshControl, RefreshControlProps } from "react-native";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useIsFocused, useRoute, useTheme } from "@react-navigation/native";
import { SYNC_DELAY } from "~/utils/constants";
import { track } from "~/analytics";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";
import { useDispatch, useStore } from "~/context/hooks";
import {
  setRefreshStarted,
  setRefreshCompleted,
  selectLastSyncTimestamp,
} from "~/reducers/portfolioRefresh";

type Props = {
  isError?: boolean;
  forwardedRef?: React.Ref<unknown>;
  /** Override or extend refresh control options per render (e.g. progressViewOffset). Merged with defaultRefreshControlProps. */
  overrideRefreshControlProps?: Partial<RefreshControlProps>;
};
function globalSyncRefreshControl<P>(
  ScrollListLike: React.ComponentType<P>,
  defaultRefreshControlProps?: Partial<RefreshControlProps>,
) {
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
    const isFocused = useIsFocused();
    const dispatch = useDispatch();
    const store = useStore();
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
      dispatch(setRefreshStarted(selectLastSyncTimestamp(store.getState())));
      track("button_clicked", {
        button: "pull to refresh",
        page: route.name,
        triggered_after_sync_error: isError ?? false,
      });
      onUserRefresh();
    }

    function handleRefresh() {
      if (refreshingRef.current) return;
      onRefresh();
    }

    useEffect(() => {
      if (!isFocused && refreshingRef.current) {
        dispatch(setRefreshCompleted());
      }
      setRefreshing(false);
    }, [isFocused, dispatch]);

    useEffect(() => {
      if (!refreshing) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      }

      const timer = setTimeout(() => {
        setRefreshing(false);
        dispatch(setRefreshCompleted());
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
            onRefresh={handleRefresh}
            {...mergedRefreshControlProps}
          />
        }
      />
    );
  }

  return React.forwardRef<unknown, P & Props>((props, ref) => (
    <Inner {...({ ...props, forwardedRef: ref } as P & Props)} />
  ));
}

export default globalSyncRefreshControl;
