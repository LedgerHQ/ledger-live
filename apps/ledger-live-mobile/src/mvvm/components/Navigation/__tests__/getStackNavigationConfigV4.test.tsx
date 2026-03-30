import type { ReactElement } from "react";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import {
  defaultNavigationOptions,
  getStackNavigationConfigV4,
} from "../getStackNavigationConfigV4";

const theme = ledgerLiveThemes.light;

describe("defaultNavigationOptions", () => {
  it("uses minimal native chrome and custom header render props", () => {
    expect(defaultNavigationOptions.headerBackButtonDisplayMode).toBe("minimal");
    expect(defaultNavigationOptions.headerLargeTitleShadowVisible).toBe(false);
    expect(defaultNavigationOptions.headerShadowVisible).toBe(false);
    expect(defaultNavigationOptions.headerBackVisible).toBe(false);
    expect(typeof defaultNavigationOptions.headerTitle).toBe("function");
    expect(typeof defaultNavigationOptions.headerLeft).toBe("function");
    expect(typeof defaultNavigationOptions.header).toBe("function");
  });
});

describe("getStackNavigationConfigV4", () => {
  it("applies theme to stack surfaces and spreads default navigation options", () => {
    const config = getStackNavigationConfigV4(theme);

    expect(config.contentStyle).toEqual({ backgroundColor: theme.colors.bg.canvas });
    expect(config.cardStyle).toEqual({ backgroundColor: theme.colors.bg.canvas });
    expect(config.headerStyle).toEqual({
      backgroundColor: theme.colors.bg.canvas,
      borderBottomColor: theme.colors.border.mutedSubtle,
    });
    expect(config.headerTitleStyle).toEqual({ color: theme.colors.text.base });
    expect(config.headerTitleAlign).toBe("center");
    expect(config.headerBackButtonDisplayMode).toBe("minimal");
    expect(config.headerShadowVisible).toBe(false);
    expect(config.headerBackVisible).toBe(false);
    expect(typeof config.header).toBe("function");
  });

  describe("closable", () => {
    it("omits close control when not closable", () => {
      expect(getStackNavigationConfigV4(theme).headerRight).toBeUndefined();
      expect(getStackNavigationConfigV4(theme, false, undefined, true).headerLeft).toBeUndefined();
    });

    it("puts close on headerRight outside onboarding", () => {
      const config = getStackNavigationConfigV4(theme, true);
      expect(typeof config.headerRight).toBe("function");
    });

    it("puts close on headerLeft during onboarding", () => {
      const config = getStackNavigationConfigV4(theme, true, undefined, true);
      expect(typeof config.headerLeft).toBe("function");
      expect(config.headerRight).toBeUndefined();
    });
  });

  it("passes onClose to NavigationHeaderCloseButton (right or left)", () => {
    const onClose = jest.fn();

    const right = getStackNavigationConfigV4(theme, true, onClose).headerRight!({});
    expect((right as ReactElement<{ onClose: () => void }>).props.onClose).toBe(onClose);

    const left = getStackNavigationConfigV4(theme, true, onClose, true).headerLeft!({});
    expect((left as ReactElement<{ onClose: () => void }>).props.onClose).toBe(onClose);
  });
});
