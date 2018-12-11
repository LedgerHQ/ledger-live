// @flow

import React from "react";
import type { NavigationScreenProp } from "react-navigation";
import { Platform, Easing, Animated } from "react-native";

import HeaderRightClose from "../components/HeaderRightClose";
import HeaderTitle from "../components/HeaderTitle";
import HeaderBackImage from "../components/HeaderBackImage";
import styles from "./styles";

export const navigationOptions = {
  headerStyle: styles.header,
  headerTitle: HeaderTitle,
  headerBackTitle: null,
  headerBackImage: HeaderBackImage,
};
export const stackNavigatorConfig: any = {
  navigationOptions,
  cardStyle: styles.card,
  headerLayoutPreset: "center",
};

if (Platform.OS === "android") {
  stackNavigatorConfig.transitionConfig = () => ({
    transitionSpec: {
      duration: 300,
      easing: Easing.out(Easing.poly(4)),
      timing: Animated.timing,
      useNativeDriver: true,
    },
    screenInterpolator: sceneProps => {
      const { position, scene } = sceneProps;

      const index = scene.index;
      const opacity = position.interpolate({
        inputRange: [index - 1, index - 0.8, index],
        outputRange: [0, 0, 1],
        extrapolate: "clamp",
      });

      const translateY = position.interpolate({
        inputRange: [index - 1, index],
        outputRange: [50, 0],
      });
      const translateX = 0;

      return {
        opacity,
        transform: [{ translateX }, { translateY }],
      };
    },
  });
}

export const closableNavigationOptions = ({
  navigation,
}: {
  navigation: NavigationScreenProp<*>,
}) => ({
  ...navigationOptions,
  headerRight: <HeaderRightClose navigation={navigation} />,
});

export const closableStackNavigatorConfig = {
  ...stackNavigatorConfig,
  navigationOptions: closableNavigationOptions,
};
