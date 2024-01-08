import React from "react";
import { DefaultTheme } from "styled-components/native";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import HeaderTitle, { Props as HeaderTitleProps } from "~/components/HeaderTitle";
import styles from "./styles";
import { Theme } from "../colors";
import { NavigationHeaderBackImage } from "~/components/NavigationHeaderBackButton";

export const defaultNavigationOptions = {
  headerStyle: styles.header,
  headerTitle: (props: HeaderTitleProps) => <HeaderTitle {...props} />,
  headerBackTitleVisible: false,
  headerBackImage: () => <NavigationHeaderBackImage />,
  headerTitleAllowFontScaling: false,
};

type ColorV2 = Theme["colors"];
type ColorV3 = DefaultTheme["colors"];

export const getStackNavigatorConfig = (
  c: ColorV2 | ColorV3,
  closable = false,
  onClose?: () => void,
) => ({
  ...defaultNavigationOptions,
  cardStyle: {
    backgroundColor: (c as ColorV3).background?.main || (c as ColorV2).background,
  },
  headerStyle: {
    backgroundColor: (c as ColorV3).background?.main || (c as ColorV2).background,
    borderBottomColor: (c as ColorV3).neutral?.c40 || (c as ColorV2).white,
    // borderBottomWidth: 1,
    elevation: 0, // remove shadow on Android
    shadowOpacity: 0, // remove shadow on iOS
  },
  headerTitleAlign: "center" as const,
  headerTitleStyle: {
    color: (c as ColorV3).neutral?.c100 || (c as ColorV2).darkBlue,
  },
  headerRight: closable
    ? () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />
    : undefined,
});
export type StackNavigatorConfig = ReturnType<typeof getStackNavigatorConfig>;
