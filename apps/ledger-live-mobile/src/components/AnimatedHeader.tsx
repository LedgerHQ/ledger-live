import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  FlatList,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import Animated from "react-native-reanimated";
import * as Animatable from "react-native-animatable";
import { space } from "@ledgerhq/native-ui/styles/theme";
import Styles from "../navigation/styles";
import LText from "./LText";
import { width } from "../helpers/normalizeSize";
import { NavigationHeaderBackButton } from "./NavigationHeaderBackButton";
import { NavigationHeaderCloseButton } from "./NavigationHeaderCloseButton";

const { interpolateNode, Extrapolate } = Animated;
const AnimatedView = Animatable.View;

type Props = {
  title: React.ReactNode;
  hasBackButton?: boolean;
  hasCloseButton?: boolean;
  backAction?: () => void;
  closeAction?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  edges?: ("top" | "right" | "left" | "bottom")[];
};
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
export default function AnimatedHeaderView({
  title,
  hasBackButton,
  hasCloseButton,
  backAction,
  closeAction,
  children,
  footer,
  style,
  titleStyle,
  edges,
}: Props) {
  const { colors, space } = useTheme();
  const [textHeight, setTextHeight] = useState(250);
  const [isReady, setReady] = useState(false);
  const onLayoutText = useCallback(event => {
    setTextHeight(event.nativeEvent.layout.height);
    setReady(true);
  }, []);
  const [scrollY] = useState(new Animated.Value(0));
  const isFocused = useIsFocused();
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
  const translateY = interpolateNode(scrollY, {
    inputRange: [0, 76],
    outputRange: [0, -45],
    extrapolate: Extrapolate.CLAMP,
  });
  const translateX = interpolateNode(scrollY, {
    inputRange: [0, 76],
    outputRange: [space[6], space[6] + (hasBackButton ? -5 : -40)],
    extrapolate: Extrapolate.CLAMP,
  });
  const scale = interpolateNode(scrollY, {
    inputRange: [0, 76],
    outputRange: [1, 0.8],
    extrapolate: Extrapolate.CLAMP,
  });
  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.root,
        {
          backgroundColor: colors.background.main,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.header,
          {
            height: Platform.OS === "ios" ? textHeight : textHeight + 40,
          },
        ]}
      >
        <View style={styles.topHeader}>
          {hasBackButton && <NavigationHeaderBackButton onPress={backAction} />}
          <View style={styles.spacer} />
          {hasCloseButton && (
            <NavigationHeaderCloseButton onPress={closeAction} />
          )}
        </View>

        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [
                {
                  translateY,
                  translateX,
                },
                {
                  scale,
                },
              ],
            },
          ]}
          onLayout={onLayoutText}
        >
          <LText
            variant="h1"
            bold
            style={[styles.title, titleStyle]}
            numberOfLines={4}
          >
            {title}
          </LText>
        </Animated.View>
      </Animated.View>
      {children && isReady && (
        <AnimatedView animation="fadeInUp" delay={50} duration={300}>
          <AnimatedFlatList
            onScroll={event}
            scrollEventThrottle={10}
            contentContainerStyle={[styles.scrollArea]}
            testID={isFocused ? "ScrollView" : undefined}
            data={[children]}
            renderItem={({ item, index }) => <View key={index}>{item}</View>}
          />
        </AnimatedView>
      )}
      {footer}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignContent: "center",
    height: 55,
  },
  spacer: {
    flex: 1,
  },
  header: {
    ...Styles.headerNoShadow,
    backgroundColor: "transparent",
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 0 : 40,
    flexDirection: "column",
    overflow: "visible",
    marginBottom: 16,
  },
  titleContainer: {
    width: width - 40,
    zIndex: 2,
  },
  title: {
    lineHeight: 45,
  },
  buttons: {
    paddingVertical: 16,
  },
  scrollArea: {
    paddingHorizontal: space[6],
    paddingTop: 50,
    paddingBottom: 116,
  },
});
