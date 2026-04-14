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
    expect(defaultNavigationOptions.headerLeft).toBeUndefined();
    expect(typeof defaultNavigationOptions.header).toBe("function");
  });
});

describe("getStackNavigationConfigV4", () => {
  it("applies theme to stack surfaces and spreads default navigation options", () => {
    const config = getStackNavigationConfigV4(theme);

    expect(config.contentStyle).toEqual({ backgroundColor: theme.colors.bg.canvas });
    expect(config.headerStyle).toEqual({
      backgroundColor: theme.colors.bg.canvas,
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
      expect(getStackNavigationConfigV4(theme).lumenNavBar).toBeUndefined();
      expect(
        getStackNavigationConfigV4(theme, undefined, false, undefined, true).lumenNavBar,
      ).toBeUndefined();
    });

    it("puts close on lumenNavBar.renderTrailing outside onboarding", () => {
      const config = getStackNavigationConfigV4(theme, undefined, true);
      expect(typeof config.lumenNavBar?.renderTrailing).toBe("function");
    });

    it("puts close on lumenNavBar.renderLeading during onboarding", () => {
      const config = getStackNavigationConfigV4(theme, undefined, true, undefined, true);
      expect(typeof config.lumenNavBar?.renderLeading).toBe("function");
      expect(config.lumenNavBar?.renderTrailing).toBeUndefined();
    });
  });

  it("passes onClose to NavigationHeaderCloseButton (right or left)", () => {
    const onClose = jest.fn();

    const right = getStackNavigationConfigV4(theme, undefined, true, onClose).lumenNavBar!
      .renderTrailing!({});
    expect((right as ReactElement<{ onClose: () => void }>).props.onClose).toBe(onClose);

    const left = getStackNavigationConfigV4(theme, undefined, true, onClose, true).lumenNavBar!
      .renderLeading!({});
    expect((left as ReactElement<{ onClose: () => void }>).props.onClose).toBe(onClose);
  });
});
