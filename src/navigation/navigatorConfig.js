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
      duration: 200,
      easing: Easing.out(Easing.poly(4)),
      timing: Animated.timing,
    },
    screenInterpolator: sceneProps => {
      const { layout, position, scene } = sceneProps;
      const { index } = scene;

      const height = layout.initHeight;
      const translateY = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: [height, 0, 0],
      });

      const opacity = position.interpolate({
        inputRange: [index - 1, index - 0.99, index],
        outputRange: [0, 1, 1],
      });

      return { opacity, transform: [{ translateY }] };
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
