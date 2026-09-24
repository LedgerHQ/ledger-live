import { useIsFocused, useRoute } from "@react-navigation/native";
import React, { useContext, useCallback } from "react";
import { Dimensions, StatusBar, FlatList, FlatListProps, View } from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useScrollOffset } from "LLM/components/Wallet40Background";
import SafeAreaView from "../SafeAreaView";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

// Default values for when context is not available (direct navigation)
const DEFAULT_HEADER_HEIGHT = 0;
const DEFAULT_TAB_BAR_HEIGHT = 0;

type CollapsibleHeaderFlatListProps<T> = AnimatedProps<FlatListProps<T>> & {
  /** When false, skip SafeAreaView (e.g. when parent nav already handles safe area). Default true. */
  useSafeArea?: boolean;
  onFlatListRef?: (ref: FlatList | null) => void;
};

function CollapsibleHeaderFlatList<T>({
  children,
  contentContainerStyle,
  useSafeArea = true,
  onFlatListRef,
  ...otherProps
}: CollapsibleHeaderFlatListProps<T>) {
  const context = useContext(WalletTabNavigatorScrollContext);

  // Handle case where context is not available (direct navigation outside WalletTabNavigator)
  const hasContext = context !== null && context !== undefined;
  const { onScroll } = useScrollOffset(context?.scrollY);
  const onGetRef = context?.onGetRef;
  const syncScrollOffset = context?.syncScrollOffset;
  const tabBarHeight = context?.tabBarHeight ?? DEFAULT_TAB_BAR_HEIGHT;
  const headerHeight = context?.headerHeight ?? DEFAULT_HEADER_HEIGHT;

  const windowHeight = Dimensions.get("window").height;
  const route = useRoute();
  const isFocused = useIsFocused();

  const onMomentumScrollEnd = useCallback(() => {
    if (syncScrollOffset) {
      syncScrollOffset(route.name);
    }
  }, [route.name, syncScrollOffset]);

  const handleRef = useCallback(
    (ref: FlatList) => {
      onFlatListRef?.(ref);
      if (onGetRef) {
        onGetRef({ key: route.name, value: ref });
      }
    },
    [onGetRef, onFlatListRef, route.name],
  );

  const list = (
    <Animated.FlatList<T>
      {...otherProps}
      scrollToOverflowEnabled={true}
      ref={handleRef}
      scrollEventThrottle={16}
      onScroll={isFocused && hasContext ? onScroll : undefined}
      onScrollEndDrag={onMomentumScrollEnd}
      onMomentumScrollEnd={onMomentumScrollEnd}
      contentContainerStyle={[
        {
          paddingTop: headerHeight,
          minHeight: windowHeight + (StatusBar.currentHeight || 0),
          paddingBottom: tabBarHeight + (StatusBar.currentHeight || 0),
        },
        contentContainerStyle,
      ]}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </Animated.FlatList>
  );

  return useSafeArea ? (
    <SafeAreaView isFlex>{list}</SafeAreaView>
  ) : (
    <View style={{ flex: 1 }}>{list}</View>
  );
}

export default CollapsibleHeaderFlatList;
