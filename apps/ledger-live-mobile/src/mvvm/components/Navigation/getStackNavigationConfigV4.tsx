import React from "react";
import type { LumenStyleSheetTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { NavBarAppearance } from "@ledgerhq/lumen-ui-rnative";
import HeaderTitle from "./HeaderTitle";
import NavBarHeader from "./NavBarHeader";
import NavigationHeaderCloseButton from "./HeaderCloseButton";
import type {
  LumenNativeStackNavigationOptions,
  LumenStackNavBarDefaults,
} from "./lumenNativeStack";

export type {
  LumenNavBarScreenOptions,
  LumenNativeStackNavigationOptions,
  LumenStackNavBarDefaults,
} from "./lumenNativeStack";

export const defaultNavigationOptions: Partial<LumenNativeStackNavigationOptions> = {
  headerTitle: props => (
    <HeaderTitle testID="navigation-header-title">{props.children}</HeaderTitle>
  ),
  headerBackButtonDisplayMode: "minimal" as const,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerBackVisible: false,
  header: props => <NavBarHeader {...props} />,
};

export type GetLumenStackScreenOptionsParams = {
  theme: Pick<LumenStyleSheetTheme, "colors">;
  appearance?: NavBarAppearance;
  closable?: boolean;
  onClose?: () => void;
  isOnboarding?: boolean;
  navBarDefaults?: LumenStackNavBarDefaults;
};

export function getLumenStackScreenOptions({
  theme,
  appearance = "compact",
  closable = false,
  onClose,
  isOnboarding,
  navBarDefaults,
}: GetLumenStackScreenOptionsParams): Partial<LumenNativeStackNavigationOptions> {
  return {
    ...defaultNavigationOptions,
    contentStyle: {
      backgroundColor: theme.colors.bg.canvas,
    },
    headerStyle: {
      backgroundColor: theme.colors.bg.canvas,
    },
    headerTitleAlign: "center" as const,
    headerTitleStyle: {
      color: theme.colors.text.base,
    },
    header: props => (
      <NavBarHeader {...props} appearance={appearance} navBarDefaults={navBarDefaults} />
    ),
    ...(closable
      ? {
          lumenNavBar: isOnboarding
            ? { renderLeading: () => <NavigationHeaderCloseButton onClose={onClose} /> }
            : { renderTrailing: () => <NavigationHeaderCloseButton onClose={onClose} /> },
        }
      : {}),
  };
}

export const getStackNavigationConfigV4 = (
  theme: Pick<LumenStyleSheetTheme, "colors">,
  appearance: NavBarAppearance = "compact",
  closable = false,
  onClose?: () => void,
  isOnboarding?: boolean,
  navBarDefaults?: LumenStackNavBarDefaults,
): Partial<LumenNativeStackNavigationOptions> =>
  getLumenStackScreenOptions({
    theme,
    appearance,
    closable,
    onClose,
    isOnboarding,
    navBarDefaults,
  });
