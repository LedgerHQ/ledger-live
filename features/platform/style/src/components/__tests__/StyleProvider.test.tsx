import { render, screen } from "@testing-library/react";
import { useTheme } from "styled-components";
import { StyleProvider } from "../StyleProvider";

function ThemeDisplay() {
  const theme = useTheme();
  return <span data-testid="theme">{JSON.stringify(theme)}</span>;
}

const mockTheme = { colors: { primary: "red" } } as never;

describe("StyleProvider (web)", () => {
  it("renders children when no props are given", () => {
    render(
      <StyleProvider>
        <span>content</span>
      </StyleProvider>,
    );
    expect(screen.getByText("content")).toBeVisible();
  });

  it("makes the theme available via useTheme when theme is provided", () => {
    render(
      <StyleProvider theme={mockTheme}>
        <ThemeDisplay />
      </StyleProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toContain("primary");
  });

  it("renders children when only colorScheme is provided", () => {
    render(
      <StyleProvider colorScheme="light">
        <span>content</span>
      </StyleProvider>,
    );
    expect(screen.getByText("content")).toBeVisible();
  });

  it("wraps with both providers when theme and colorScheme are provided", () => {
    render(
      <StyleProvider theme={mockTheme} colorScheme="dark">
        <ThemeDisplay />
      </StyleProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toContain("primary");
  });
});
