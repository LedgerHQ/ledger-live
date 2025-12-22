import React from "react";
import { DefaultTheme } from "styled-components/native";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import HeaderTitle, { Props as HeaderTitleProps } from "~/components/HeaderTitle";
import styles from "./styles";
import { Theme } from "../colors";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import CustomNavigationHeader from "LLM/components/CustomNavigationHeader";
import { DETOX_ENABLED } from "~/utils/constants";

export const defaultNavigationOptions: Partial<NativeStackNavigationOptions> = {
  headerStyle: styles.header,
  headerTitle: (props: HeaderTitleProps) => <HeaderTitle {...props} />,
  headerLeft: () => <NavigationHeaderBackButton />,
  headerBackButtonDisplayMode: "minimal" as const,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerBackVisible: false,
  header: props => <CustomNavigationHeader {...props} />,
  animation: DETOX_ENABLED ? "none" : "default",
};

type ColorV2 = Theme["colors"];
type ColorV3 = DefaultTheme["colors"];

export const getStackNavigatorConfig = (
  c: ColorV2 | ColorV3,
  closable = false,
  onClose?: () => void,
  isOnboarding?: boolean,
) => ({
  ...defaultNavigationOptions,
  contentStyle: {
    backgroundColor: (c as ColorV3).background?.main || (c as ColorV2).background,
  },
  // Keep backward compatibility while migrating from stack to native-stack
  cardStyle: {
    backgroundColor: (c as ColorV3).background?.main || (c as ColorV2).background,
  },
  headerStyle: {
    backgroundColor: (c as ColorV3).background?.main || (c as ColorV2).background,
    borderBottomColor: (c as ColorV3).neutral?.c40 || (c as ColorV2).white,
  },
  headerTitleAlign: "center" as const,
  headerTitleStyle: {
    color: (c as ColorV3).neutral?.c100 || (c as ColorV2).darkBlue,
  },
  ...(isOnboarding
    ? {
        headerLeft: closable
          ? () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} isOnboarding />
          : undefined,
      }
    : {
        headerRight: closable
          ? () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />
          : undefined,
      }),
});
