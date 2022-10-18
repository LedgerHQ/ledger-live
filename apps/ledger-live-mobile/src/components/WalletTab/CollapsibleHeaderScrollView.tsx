import { useRoute } from "@react-navigation/native";
import React, { useContext, useCallback } from "react";
import {
  Dimensions,
  Animated,
  ScrollView,
  ScrollViewProps,
  StatusBar,
} from "react-native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

const CollapsibleHeaderScrollView = ({
  children,
  contentContainerStyle,
  ...otherProps
}: ScrollViewProps) => {
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
    <Animated.ScrollView
      scrollToOverflowEnabled={true}
      ref={(ref: ScrollView) => onGetRef({ key: route.name, value: ref })}
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
      testID={route.name}
      {...otherProps}
    >
      {children}
    </Animated.ScrollView>
  );
};

export default CollapsibleHeaderScrollView;
