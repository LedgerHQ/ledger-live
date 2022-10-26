import React, { createContext, useCallback, useEffect, useRef } from "react";
import { Animated, FlatList, ScrollView } from "react-native";

const tabBarHeight = 74;
const headerHeight = 72;

type WalletTabNavigatorScrollContextData = {
  scrollY: Animated.Value;
  scrollableRefArray: React.MutableRefObject<
    { key: string; value: ScrollView | FlatList }[]
  >;
  scrollableOffsetMap: React.MutableRefObject<{ [key: string]: number }>;
  onGetRef: ({
    key,
    value,
  }: {
    key: string;
    value: ScrollView | FlatList;
  }) => void;
  syncScrollOffset: (key: string) => void;
  tabBarHeight: number;
  headerHeight: number;
};

export const WalletTabNavigatorScrollContext =
  createContext<WalletTabNavigatorScrollContextData>(
    {} as WalletTabNavigatorScrollContextData,
  );

type AnimatedValueWithPrivate = Animated.Value & { _value: number };

export default function WalletTabNavigatorScrollManager({
  children,
  currentRouteName,
}: {
  children: React.ReactNode;
  currentRouteName?: string;
}) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollableRefArray = useRef<
    { key: string; value: ScrollView | FlatList }[]
  >([]);
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
          // eslint-disable-next-line no-underscore-dangle
          const scrollYValue = (scrollY as AnimatedValueWithPrivate)._value;

          if (
            item.value &&
            ((scrollYValue < headerHeight && scrollYValue >= 0) ||
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
    [scrollY],
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
        tabBarHeight: false ? 0 : tabBarHeight,
        headerHeight: false ? 88 : headerHeight,
      }}
    >
      {children}
    </WalletTabNavigatorScrollContext.Provider>
  );
}
