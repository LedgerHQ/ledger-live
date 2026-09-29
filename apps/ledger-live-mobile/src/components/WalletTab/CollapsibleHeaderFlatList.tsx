import React from "react";
import { Dimensions, StatusBar, FlatList, FlatListProps, View } from "react-native";
import Animated from "react-native-reanimated";
import { useScrollOffset } from "LLM/components/Wallet40Background";
import SafeAreaView from "../SafeAreaView";
import {
  WALLET_TAB_BAR_HEIGHT,
  WALLET_TAB_HEADER_HEIGHT,
  useWalletNavScrollContext,
} from "./WalletTabNavigatorScrollManager";

// Reanimated's FlatList renders its own cells, so it doesn't take a CellRendererComponent.
type CollapsibleHeaderFlatListProps<T> = Omit<FlatListProps<T>, "CellRendererComponent"> & {
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
  // Outside the Wallet tab (e.g. Market), the list has no tab chrome to clear and no scroll to share.
  const { scrollY } = useWalletNavScrollContext();
  const { onScroll } = useScrollOffset(scrollY);
  const isInWalletTab = scrollY !== undefined;
  const headerHeight = isInWalletTab ? WALLET_TAB_HEADER_HEIGHT : 0;
  const tabBarHeight = isInWalletTab ? WALLET_TAB_BAR_HEIGHT : 0;
  const windowHeight = Dimensions.get("window").height;

  const list = (
    <Animated.FlatList<T>
      {...otherProps}
      scrollToOverflowEnabled={true}
      ref={onFlatListRef}
      scrollEventThrottle={16}
      onScroll={isInWalletTab ? onScroll : undefined}
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
