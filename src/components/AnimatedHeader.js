// @flow
import React, { useState, useCallback } from "react";
import { View, StyleSheet, Platform, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useTheme,
  useIsFocused,
} from "@react-navigation/native";
import Animated from "react-native-reanimated";

import * as Animatable from "react-native-animatable";
import Styles from "../navigation/styles";
import LText from "./LText";
import { normalize, width } from "../helpers/normalizeSize";
import ArrowLeft from "../icons/ArrowLeft";
import Close from "../icons/Close";

const { interpolateNode, Extrapolate } = Animated;

const AnimatedView = Animatable.View;

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

const BackButton = ({
  colors,
  navigation,
  action,
}: {
  colors: *,
  navigation: *,
  action?: () => void,
}) => (
  <TouchableOpacity
    hitSlop={hitSlop}
    style={styles.buttons}
    onPress={() => (action ? action() : navigation.goBack())}
  >
    <ArrowLeft size={18} color={colors.darkBlue} />
  </TouchableOpacity>
);

const CloseButton = ({
  colors,
  navigation,
  action,
}: {
  colors: *,
  navigation: *,
  action?: () => void,
}) => (
  <TouchableOpacity
    hitSlop={hitSlop}
    onPress={() => (action ? action() : navigation.popToTop())}
    style={styles.buttons}
  >
    <Close size={18} color={colors.darkBlue} />
  </TouchableOpacity>
);

type Props = {
  title: React$Node,
  hasBackButton?: boolean,
  hasCloseButton?: boolean,
  backAction?: () => void,
  closeAction?: () => void,
  children?: React$Node,
  footer?: React$Node,
  style?: *,
  titleStyle?: *,
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
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [textHeight, setTextHeight] = useState(250);
  const [isReady, setReady] = useState(false);

  const onLayoutText = useCallback(event => {
    setTextHeight(event.nativeEvent.layout.height);
    setReady(true);
  }, []);

  const [scrollY] = useState(new Animated.Value(0));
  const isFocused = useIsFocused();

  const event = Animated.event([
    { nativeEvent: { contentOffset: { y: scrollY } } },
    {
      useNativeDriver: true,
    },
  ]);

  const translateY = interpolateNode(scrollY, {
    inputRange: [0, 76],
    outputRange: [0, -50],
    extrapolate: Extrapolate.CLAMP,
  });
  const translateX = interpolateNode(scrollY, {
    inputRange: [0, 76],
    outputRange: [0, hasBackButton ? -5 : -40],
    extrapolate: Extrapolate.CLAMP,
  });

  const scale = interpolateNode(scrollY, {
    inputRange: [0, 76],
    outputRange: [1, 0.8],
    extrapolate: Extrapolate.CLAMP,
  });

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }, style]}
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
          {hasBackButton && (
            <BackButton
              colors={colors}
              navigation={navigation}
              action={backAction}
            />
          )}
          <View style={styles.spacer} />
          {hasCloseButton && (
            <CloseButton
              colors={colors}
              navigation={navigation}
              action={closeAction}
            />
          )}
        </View>

        <Animated.View
          bold
          style={[
            styles.titleContainer,
            { transform: [{ translateY, translateX }, { scale }] },
          ]}
          onLayout={onLayoutText}
        >
          <LText bold style={[styles.title, titleStyle]} numberOfLines={4}>
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
  topHeader: { flexDirection: "row", alignContent: "center", height: 50 },
  spacer: { flex: 1 },
  header: {
    ...Styles.headerNoShadow,
    backgroundColor: "transparent",
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 0 : 40,
    flexDirection: "column",
    overflow: "visible",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  titleContainer: {
    width: width - 40,
    zIndex: 2,
  },
  title: {
    fontSize: normalize(34),
    lineHeight: 45,
  },
  buttons: {
    paddingVertical: 16,
  },
  scrollArea: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
  },
  spacerTop: { marginTop: 60 },
  spacerBottom: { marginTop: 24 },
});
