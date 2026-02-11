import { useIsFocused, useRoute } from "@react-navigation/native";
import React, { useContext, useCallback, useRef } from "react";
import { Dimensions, Animated, StatusBar, FlatList, FlatListProps, View } from "react-native";
import SafeAreaView from "../SafeAreaView";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import AnimatedProps = Animated.AnimatedProps;

// Default values for when context is not available (direct navigation)
const DEFAULT_HEADER_HEIGHT = 0;
const DEFAULT_TAB_BAR_HEIGHT = 0;

function CollapsibleHeaderFlatList<T>({
  children,
  contentContainerStyle,
  ...otherProps
}: AnimatedProps<FlatListProps<T>>) {
  const context = useContext(WalletTabNavigatorScrollContext);

  // Fallback scrollY for when context is not available (direct navigation outside WalletTabNavigator)
  const fallbackScrollY = useRef(new Animated.Value(0)).current;

  // Handle case where context is not available (direct navigation outside WalletTabNavigator)
  const hasContext = context !== null && context !== undefined;
  const scrollY = context?.scrollY ?? fallbackScrollY;
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
      if (onGetRef) {
        onGetRef({ key: route.name, value: ref });
      }
    },
    [onGetRef, route.name],
  );

  return (
    <View style={{ flex: 1, marginTop: headerHeight }}>
      <Animated.FlatList<T>
        {...otherProps}
        scrollToOverflowEnabled={true}
        ref={handleRef}
        scrollEventThrottle={16}
        onScroll={
          isFocused && hasContext
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })
            : undefined
        }
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
    </View>
  );
}

export default CollapsibleHeaderFlatList;
