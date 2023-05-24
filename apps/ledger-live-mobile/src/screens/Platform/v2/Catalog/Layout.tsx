import { Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

type PageHeaderContentLayoutProps = {
  title?: React.ReactNode;
  topHeaderContent?: React.ReactNode;
  searchContent?: React.ReactNode;
  titleHeaderContent?: React.ReactNode;
  middleHeaderContent?: React.ReactNode;
  bottomHeaderContent?: React.ReactNode;
  disableStyleBottomHeader?: boolean;
  subBottomHeaderContent?: React.ReactNode;
  disableStyleSubBottomHeader?: boolean;
  bodyContent?: React.ReactNode;
  listStickyElement?: number[];
  isTitleVisible?: boolean;
};

export function Layout({
  title,
  topHeaderContent,
  searchContent,
  titleHeaderContent,
  middleHeaderContent,
  bottomHeaderContent,
  disableStyleBottomHeader = false,
  subBottomHeaderContent,
  disableStyleSubBottomHeader = false,
  bodyContent,
  listStickyElement,
  isTitleVisible,
}: PageHeaderContentLayoutProps) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const opacityStyle = useAnimatedStyle(() => {
    const opacity = isTitleVisible
      ? 1
      : interpolate(scrollY.value, [0, 76], [0, 1], Extrapolate.CLAMP);

    return {
      opacity,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <Flex
        style={[
          styles.marginHorizontal,
          {
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        {topHeaderContent}
        <Animated.View style={[opacityStyle]}>
          <Text
            fontSize={20}
            marginLeft={4}
            fontWeight="semiBold"
            variant="large"
          >
            {title}
          </Text>
        </Animated.View>
      </Flex>
      <Flex style={[styles.marginHorizontal]}>{searchContent}</Flex>
      <ScrollContainer
        onScroll={scrollHandler}
        scrollEventThrottle={10}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={listStickyElement}
      >
        {titleHeaderContent && (
          <Flex style={[styles.marginHorizontal]}>{titleHeaderContent}</Flex>
        )}
        {middleHeaderContent && (
          <Flex style={[styles.marginHorizontal]}>{middleHeaderContent}</Flex>
        )}
        {bottomHeaderContent && (
          <Flex style={!disableStyleBottomHeader && styles.marginHorizontal}>
            {bottomHeaderContent}
          </Flex>
        )}
        {subBottomHeaderContent && (
          <Flex style={!disableStyleSubBottomHeader && styles.marginHorizontal}>
            {subBottomHeaderContent}
          </Flex>
        )}
        <Flex style={[styles.marginHorizontal]}>{bodyContent}</Flex>
      </ScrollContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  topHeader: {
    flexDirection: "row",
    alignContent: "center",
    height: 55,
  },
  marginHorizontal: {
    marginHorizontal: 16,
  },
});
