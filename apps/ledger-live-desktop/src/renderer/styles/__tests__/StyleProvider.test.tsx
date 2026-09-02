import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { useTheme } from "styled-components";
import StyleProvider from "../StyleProvider";

function PaletteProbe() {
  const theme = useTheme();
  return <span data-testid="palette">{theme.theme}</span>;
}

describe("StyleProvider", () => {
  afterEach(() => {
    document.documentElement.classList.remove("light", "dark");
  });

  it("gives its subtree the requested styled-components palette", () => {
    render(
      <StyleProvider selectedPalette="dark">
        <PaletteProbe />
      </StyleProvider>,
    );

    expect(screen.getByTestId("palette")).toHaveTextContent("dark");
  });

  it("leaves the document color scheme to the app-level Lumen provider", () => {
    render(
      <ThemeProvider colorScheme="light">
        <StyleProvider selectedPalette="dark">
          <span>dark banner</span>
        </StyleProvider>
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("keeps the document color scheme when a scoped palette mounts on an already themed tree", () => {
    const { rerender } = render(
      <ThemeProvider colorScheme="light">
        <span>app</span>
      </ThemeProvider>,
    );

    rerender(
      <ThemeProvider colorScheme="light">
        <StyleProvider selectedPalette="dark">
          <span>dark banner</span>
        </StyleProvider>
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
