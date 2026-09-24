import React, { createContext, useCallback, useRef } from "react";
import { FlatList, ScrollView } from "react-native";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

const tabBarHeight = 56;
const headerHeight = 48;

interface WalletTabNavigatorScrollContextData {
  scrollY: SharedValue<number>;
  scrollableRefArray: React.RefObject<{ key: string; value: ScrollView | FlatList }[]>;
  scrollableOffsetMap: React.RefObject<{ [key: string]: number }>;
  onGetRef: ({ key, value }: { key: string; value: ScrollView | FlatList }) => void;
  syncScrollOffset: (key: string) => void;
  tabBarHeight: number;
  headerHeight: number;
}

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
  const scrollY = useSharedValue(0);
  const scrollableRefArray = useRef<{ key: string; value: ScrollView | FlatList }[]>([]);
  const scrollableOffsetMap = useRef<{ [key: string]: number }>({});

  const syncScrollOffset = useCallback(
    (currentRouteKey: string) => {
      if (currentRouteName) {
        scrollableOffsetMap.current[currentRouteName] = Math.max(scrollY.value, 0); // prevent negative offset
      }
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
    [currentRouteName, scrollY],
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
        tabBarHeight: tabBarHeight,
        headerHeight: headerHeight,
      }}
    >
      {children}
    </WalletTabNavigatorScrollContext.Provider>
  );
}
