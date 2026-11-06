import React from "react";
import { applyNavigationBarTheme } from "@shared/system-bars";
import { render } from "@tests/test-renderer";
import StyleProvider from "~/StyleProvider";
import NavBarColorHandler from "./NavBarColorHandler";

jest.mock("@shared/system-bars", () => ({
  applyNavigationBarTheme: jest.fn(),
}));

const mockedApplyNavigationBarTheme = jest.mocked(applyNavigationBarTheme);

describe("NavBarColorHandler", () => {
  beforeEach(() => {
    mockedApplyNavigationBarTheme.mockReset();
  });

  it("themes the navigation bar for the dark palette", () => {
    render(<NavBarColorHandler />);

    expect(mockedApplyNavigationBarTheme).toHaveBeenCalledWith({ isDark: true });
  });

  it("themes the navigation bar for the light palette", () => {
    render(
      <StyleProvider selectedPalette="light">
        <NavBarColorHandler />
      </StyleProvider>,
    );

    expect(mockedApplyNavigationBarTheme).toHaveBeenCalledWith({ isDark: false });
  });
});
