// @flow
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import Animated from "react-native-reanimated";

import Styles from "../navigation/styles";
import LText from "./LText";
import { normalize, width } from "../helpers/normalizeSize";
import ArrowLeft from "../icons/ArrowLeft";
import Close from "../icons/Close";

const { interpolate, Extrapolate } = Animated;

const AnimatedLText = Animated.createAnimatedComponent(View);

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
  <Pressable
    hitSlop={hitSlop}
    style={styles.buttons}
    onPress={() => (action ? action() : navigation.goBack())}
  >
    <ArrowLeft size={18} color={colors.darkBlue} />
  </Pressable>
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
  <Pressable
    hitSlop={hitSlop}
    onPress={() => (action ? action() : navigation.popToTop())}
    style={styles.buttons}
  >
    <Close size={18} color={colors.darkBlue} />
  </Pressable>
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
};

export default function AnimatedHeaderView({
  title,
  hasBackButton,
  hasCloseButton,
  backAction,
  closeAction,
  children,
  footer,
  style,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [scrollY] = useState(new Animated.Value(0));

  const event = Animated.event([
    { nativeEvent: { contentOffset: { y: scrollY } } },
    {
      useNativeDriver: true,
    },
  ]);

  const translateY = interpolate(scrollY, {
    inputRange: [0, 76],
    outputRange: [0, -50],
    extrapolate: Extrapolate.CLAMP,
  });
  const translateX = interpolate(scrollY, {
    inputRange: [0, 76],
    outputRange: [0, -5],
    extrapolate: Extrapolate.CLAMP,
  });

  const scale = interpolate(scrollY, {
    inputRange: [0, 76],
    outputRange: [1, 0.8],
    extrapolate: Extrapolate.CLAMP,
  });

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }, style]}
    >
      <Animated.View style={[styles.header]}>
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

        <AnimatedLText
          bold
          style={[
            styles.titleContainer,
            { transform: [{ translateY, translateX }, { scale }] },
          ]}
        >
          <LText bold style={[styles.title]}>
            {title}
          </LText>
        </AnimatedLText>
      </Animated.View>
      {children && (
        <Animated.ScrollView
          onScroll={event}
          scrollEventThrottle={10}
          contentContainerStyle={styles.scrollArea}
        >
          {children}
        </Animated.ScrollView>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: { flexDirection: "row", alignContent: "center" },
  spacer: { flex: 1 },
  header: {
    ...Styles.headerNoShadow,
    backgroundColor: "transparent",
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 0 : 40,
    height: Platform.OS === "ios" ? 40 : 74,
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
    fontSize: normalize(32),
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
