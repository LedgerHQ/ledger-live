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
    mockedApplyNavigationBarTheme.mockReset().mockResolvedValue(undefined);
  });

  it("applies the dark Lumen canvas color with light buttons", () => {
    render(<NavBarColorHandler />);

    expect(mockedApplyNavigationBarTheme).toHaveBeenCalledWith({
      backgroundColor: expect.any(String),
      isDark: true,
    });
  });

  it("applies the light Lumen canvas color with dark buttons", () => {
    render(
      <StyleProvider selectedPalette="light">
        <NavBarColorHandler />
      </StyleProvider>,
    );

    expect(mockedApplyNavigationBarTheme).toHaveBeenCalledWith({
      backgroundColor: expect.any(String),
      isDark: false,
    });
  });

  it("uses a different canvas color for each theme", () => {
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

  it("logs the error when the navigation bar cannot be themed", async () => {
    const error = new Error("no activity");
    mockedApplyNavigationBarTheme.mockRejectedValue(error);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<NavBarColorHandler />);

    await Promise.resolve();
    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });
});
