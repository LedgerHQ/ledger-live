import React from "react";
import { NativeModules } from "react-native";
import { applyNavigationBarTheme } from "@shared/system-bars";
import { render } from "@tests/test-renderer";
import StyleProvider from "~/StyleProvider";
import NavBarColorHandler from "./NavBarColorHandler";

jest.mock("@shared/system-bars", () => ({
  applyNavigationBarTheme: jest.fn(),
}));

const mockedApplyNavigationBarTheme = jest.mocked(applyNavigationBarTheme);
const OPAQUE_BLACK = -16777216;

describe("NavBarColorHandler", () => {
  beforeEach(() => {
    mockedApplyNavigationBarTheme.mockReset();
  });

  afterEach(() => {
    delete NativeModules.NavigationBarColorModule;
  });

  it("themes the navigation bar for the dark palette", () => {
    render(<NavBarColorHandler />);

    expect(mockedApplyNavigationBarTheme).toHaveBeenCalledWith(
      expect.objectContaining({ isDark: true, backgroundColor: expect.any(String) }),
    );
  });

  it("themes the navigation bar for the light palette", () => {
    render(
      <StyleProvider selectedPalette="light">
        <NavBarColorHandler />
      </StyleProvider>,
    );

    expect(mockedApplyNavigationBarTheme).toHaveBeenCalledWith(
      expect.objectContaining({ isDark: false, backgroundColor: expect.any(String) }),
    );
  });

  it("paints the navigation bar with a different canvas color for each palette", () => {
    render(<NavBarColorHandler />);
    render(
      <StyleProvider selectedPalette="light">
        <NavBarColorHandler />
      </StyleProvider>,
    );

    const [dark, light] = mockedApplyNavigationBarTheme.mock.calls.map(
      ([theme]) => theme.backgroundColor,
    );
    expect(dark).not.toEqual(light);
  });

  it("paints the background through the app's native color module", () => {
    const setBackgroundColor = jest.fn();
    NativeModules.NavigationBarColorModule = { setBackgroundColor };

    render(<NavBarColorHandler />);
    const [{ paintBackground }] = mockedApplyNavigationBarTheme.mock.calls[0];
    paintBackground?.(OPAQUE_BLACK);

    expect(setBackgroundColor).toHaveBeenCalledWith(OPAQUE_BLACK);
  });

  it("does not paint the background when the native color module is missing", () => {
    render(<NavBarColorHandler />);

    const [{ paintBackground }] = mockedApplyNavigationBarTheme.mock.calls[0];
    expect(paintBackground).toBeUndefined();
  });
});
