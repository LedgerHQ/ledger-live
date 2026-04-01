import React from "react";
import type { LumenStyleSheetTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import styles from "~/navigation/styles";
import HeaderTitle from "./HeaderTitle";
import HeaderBackButton from "./HeaderBackButton";
import CustomNavigationHeader from "../CustomNavigationHeader";
import NavigationHeaderCloseButton from "./HeaderCloseButton";

export const defaultNavigationOptions: Partial<NativeStackNavigationOptions> = {
  headerStyle: styles.header,
  headerTitle: props => (
    <HeaderTitle testID="navigation-header-title">{props.children}</HeaderTitle>
  ),
  headerLeft: () => <HeaderBackButton testID="navigation-header-back-button" />,
  headerBackButtonDisplayMode: "minimal" as const,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerBackVisible: false,
  header: props => <CustomNavigationHeader {...props} />,
};

export const getStackNavigationConfigV4 = (
  theme: Pick<LumenStyleSheetTheme, "colors">,
  closable = false,
  onClose?: () => void,
  isOnboarding?: boolean,
) => ({
  ...defaultNavigationOptions,
  contentStyle: {
    backgroundColor: theme.colors.bg.canvas,
  },
  cardStyle: {
    backgroundColor: theme.colors.bg.canvas,
  },
  headerStyle: {
    backgroundColor: theme.colors.bg.canvas,
    borderBottomColor: theme.colors.border.mutedSubtle,
  },
  headerTitleAlign: "center" as const,
  headerTitleStyle: {
    color: theme.colors.text.base,
  },
  ...(isOnboarding
    ? {
        headerLeft: closable ? () => <NavigationHeaderCloseButton onClose={onClose} /> : undefined,
      }
    : {
        headerRight: closable ? () => <NavigationHeaderCloseButton onClose={onClose} /> : undefined,
      }),
});
