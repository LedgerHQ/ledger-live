import { useRoute } from "@react-navigation/native";
import React, { useContext, useCallback } from "react";
import {
  Dimensions,
  Animated,
  StatusBar,
  FlatList,
  FlatListProps,
} from "react-native";
import AnimatedProps = Animated.AnimatedProps;
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

function CollapsibleHeaderFlatList<T>({
  children,
  contentContainerStyle,
  ...otherProps
}: AnimatedProps<FlatListProps<T>>) {
  const { scrollY, onGetRef, syncScrollOffset, tabBarHeight, headerHeight } =
    useContext(WalletTabNavigatorScrollContext);
  const windowHeight = Dimensions.get("window").height;
  const route = useRoute();

  const onMomentumScrollEnd = useCallback(() => {
    syncScrollOffset(route.name);
  }, [route.name, syncScrollOffset]);

  const onScrollEndDrag = useCallback(() => {
    syncScrollOffset(route.name);
  }, [route.name, syncScrollOffset]);

  return (
    <Animated.FlatList<T>
      scrollToOverflowEnabled={true}
      ref={(ref: FlatList) => onGetRef({ key: route.name, value: ref })}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: true,
        },
      )}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      contentContainerStyle={[
        {
          paddingTop: headerHeight + tabBarHeight,
          minHeight: windowHeight + (StatusBar.currentHeight || 0),
        },
        contentContainerStyle,
      ]}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      {...otherProps}
    >
      {children}
    </Animated.FlatList>
  );
}

export default CollapsibleHeaderFlatList;
