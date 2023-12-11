import { useIsFocused, useRoute } from "@react-navigation/native";
import React, { useContext, useCallback } from "react";
import { Dimensions, Animated, ScrollView, ScrollViewProps, StatusBar } from "react-native";
import SafeAreaView from "../SafeAreaView";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

const CollapsibleHeaderScrollView = ({
  children,
  contentContainerStyle,
  ...otherProps
}: ScrollViewProps) => {
  const { scrollY, onGetRef, syncScrollOffset, headerHeight } = useContext(
    WalletTabNavigatorScrollContext,
  );
  const windowHeight = Dimensions.get("window").height;
  const route = useRoute();
  const isFocused = useIsFocused();

  const onMomentumScrollEnd = useCallback(() => {
    syncScrollOffset(route.name);
  }, [route.name, syncScrollOffset]);

  return (
    <SafeAreaView isFlex>
      <Animated.ScrollView
        scrollToOverflowEnabled={true}
        ref={(ref: ScrollView) => onGetRef({ key: route.name, value: ref })}
        scrollEventThrottle={16}
        onScroll={
          isFocused
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
    </SafeAreaView>
  );
};

export default CollapsibleHeaderScrollView;
