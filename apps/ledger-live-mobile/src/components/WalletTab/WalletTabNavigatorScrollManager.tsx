import React, { createContext, useCallback, useEffect, useRef } from "react";
import { Animated, FlatList, ScrollView } from "react-native";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";

const tabBarHeight = 56;
const headerHeight = 48;
const headerHeightWithTabNavigatorDisabled = 64;

type WalletTabNavigatorScrollContextData = {
  scrollY: Animated.Value;
  scrollableRefArray: React.MutableRefObject<{ key: string; value: ScrollView | FlatList }[]>;
  scrollableOffsetMap: React.MutableRefObject<{ [key: string]: number }>;
  onGetRef: ({ key, value }: { key: string; value: ScrollView | FlatList }) => void;
  syncScrollOffset: (key: string) => void;
  tabBarHeight: number;
  headerHeight: number;
};

export const WalletTabNavigatorScrollContext = createContext<WalletTabNavigatorScrollContextData>(
  {} as WalletTabNavigatorScrollContextData,
);

// Partly based on https://github.com/JungHsuan/react-native-collapsible-tabview/blob/master/src/CollapsibleTabView.js
export default function WalletTabNavigatorScrollManager({
  children,
  currentRouteName,
}: {
  children: React.ReactNode;
  currentRouteName?: string;
}) {
  const walletNftGalleryFeature = useFeature("walletNftGallery");
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollableRefArray = useRef<{ key: string; value: ScrollView | FlatList }[]>([]);
  const scrollableOffsetMap = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      if (currentRouteName) {
        scrollableOffsetMap.current[currentRouteName] = value;
      }
    });
    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [currentRouteName, scrollY, scrollableOffsetMap]);

  const syncScrollOffset = useCallback(
    (currentRouteKey: string) => {
      scrollableRefArray.current.forEach(item => {
        if (item.key !== currentRouteKey) {
          const scrollYValue = currentRouteName
            ? scrollableOffsetMap.current[currentRouteName]
            : null;

          if (
            scrollYValue !== null &&
            item.value &&
            (scrollYValue < headerHeight ||
              (scrollYValue >= headerHeight &&
                scrollableOffsetMap.current[item.key] < headerHeight))
          ) {
            const offsetTarget = Math.min(scrollYValue, headerHeight);
            // Ref can be a ScrollView or a FlatList, they have different call for scrolling and i don't know how to handle typescript for that...

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (item.value.scrollTo) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              item.value.scrollTo({
                y: offsetTarget,
                animated: false,
              });
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
            } else if (item.value.scrollToOffset) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              item.value.scrollToOffset({
                offset: offsetTarget,
                animated: false,
              });
            }
            scrollableOffsetMap.current[item.key] = offsetTarget;
          }
        }
      });
    },
    [currentRouteName],
  );

  const onGetRef = useCallback(
    ({ key, value }: { key: string; value: ScrollView | FlatList }) => {
      if (value) {
        const found = scrollableRefArray.current.find(e => e.key === key);
        if (!found) {
          scrollableRefArray.current.push({
            key,
            value,
          });
          scrollableOffsetMap.current[key] = 0;
          if (currentRouteName) {
            setTimeout(() => syncScrollOffset(currentRouteName), 0);
          }
        } else {
          // NOTE: We must update the ref if it already exists
          // otherwise no scrollTop or scrollToOffset calls work
          // as it is called on the old ref and does nothing.
          found.value = value;
        }
      }
    },
    [currentRouteName, syncScrollOffset],
  );

  return (
    <WalletTabNavigatorScrollContext.Provider
      value={{
        scrollY,
        scrollableRefArray,
        scrollableOffsetMap,
        onGetRef,
        syncScrollOffset,
        tabBarHeight: walletNftGalleryFeature?.enabled ? tabBarHeight : 0,
        headerHeight: walletNftGalleryFeature?.enabled
          ? headerHeight
          : headerHeightWithTabNavigatorDisabled,
      }}
    >
      {children}
    </WalletTabNavigatorScrollContext.Provider>
  );
}
