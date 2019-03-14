// @flow

import React from "react";
import type { NavigationScreenProp } from "react-navigation";
import HeaderRightClose from "../components/HeaderRightClose";
import HeaderTitle from "../components/HeaderTitle";
import HeaderBackImage from "../components/HeaderBackImage";
import styles from "./styles";

export const defaultNavigationOptions = {
  headerStyle: styles.header,
  headerTitle: HeaderTitle,
  headerBackTitle: null,
  headerBackImage: HeaderBackImage,
  headerTitleAllowFontScaling: false,
};

export const stackNavigatorConfig = {
  defaultNavigationOptions,
  cardStyle: styles.card,
  headerLayoutPreset: "center",
};

export const closableNavigationOptions = ({
  navigation,
}: {
  navigation: NavigationScreenProp<*>,
}) => ({
  ...defaultNavigationOptions,
  headerRight: <HeaderRightClose navigation={navigation} />,
});

export const closableStackNavigatorConfig = {
  ...stackNavigatorConfig,
  defaultNavigationOptions: closableNavigationOptions,
};
