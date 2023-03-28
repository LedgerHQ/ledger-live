import { Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet } from "react-native";
import Animated, {
  Extrapolate,
  interpolateNode,
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
  const [scrollY] = useState(new Animated.Value(0));
  const eventArgs = [
    {
      nativeEvent: {
        contentOffset: {
          y: scrollY,
        },
      },
    },
    {
      useNativeDriver: true,
    },
  ];
  const event = Animated.event<typeof eventArgs>(eventArgs);
  const opacity = interpolateNode(scrollY, {
    inputRange: [0, 76],
    outputRange: [0, 1],
    extrapolate: Extrapolate.CLAMP,
  });
  return (
    <SafeAreaView style={styles.container}>
      <Flex
        style={[
          styles.topHeader,
          styles.marginHorizontal,
          {
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        {topHeaderContent}
        <Animated.View style={[{ opacity: isTitleVisible ? 1 : opacity }]}>
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
        onScroll={event}
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
