// @flow

import React from "react";
import type { NavigationScreenProp } from "react-navigation";
import HeaderRightClose from "../components/HeaderRightClose";
import HeaderTitle from "../components/HeaderTitle";
import HeaderBackImage from "../components/HeaderBackImage";
import { getFontStyle } from "../components/LText";
import styles from "./styles";
import colors from "../colors";

export const defaultNavigationOptions = {
  headerStyle: styles.header,
  headerTitle: (props: {}) => <HeaderTitle {...props} />,
  headerBackTitle: null,
  headerBackImage: (props: {}) => <HeaderBackImage {...props} />,
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

export const topTabNavigatorConfig = {
  tabBarOptions: {
    allowFontScaling: false,
    activeTintColor: colors.live,
    inactiveTintColor: colors.grey,
    upperCaseLabel: false,
    labelStyle: {
      fontSize: 14,
      ...getFontStyle({
        semiBold: true,
      }),
    },
    style: {
      backgroundColor: colors.white,
      height: 48,
    },
    indicatorStyle: {
      backgroundColor: colors.live,
    },
  },
};
