import React from "react";
import { DefaultTheme } from "styled-components/native";
import { NavigationHeaderCloseButtonAdvanced } from "../components/NavigationHeaderCloseButton";
import HeaderTitle, { Props as HeaderTitleProps } from "../components/HeaderTitle";
import styles from "./styles";
import { NavigationHeaderBackImage } from "../components/NavigationHeaderBackButton";

export const defaultNavigationOptions = {
  headerStyle: styles.header,
  headerTitle: (props: HeaderTitleProps) => <HeaderTitle {...props} />,
  headerBackTitleVisible: false,
  headerBackImage: () => <NavigationHeaderBackImage />,
  headerTitleAllowFontScaling: false,
};

type ColorV3 = DefaultTheme["colors"];

export const getStackNavigatorConfig = (c: ColorV3, closable = false, onClose?: () => void) => ({
  ...defaultNavigationOptions,
  cardStyle: {
    backgroundColor: c.background?.main,
  },
  headerStyle: {
    backgroundColor: c.background?.main,
    borderBottomColor: c.neutral?.c40,
    // borderBottomWidth: 1,
    elevation: 0, // remove shadow on Android
    shadowOpacity: 0, // remove shadow on iOS
  },
  headerTitleAlign: "center" as const,
  headerTitleStyle: {
    color: c.neutral?.c100,
  },
  headerRight: closable
    ? () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />
    : undefined,
});
export type StackNavigatorConfig = ReturnType<typeof getStackNavigatorConfig>;
