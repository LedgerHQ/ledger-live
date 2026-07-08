import { render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "styled-components";
import { withStyleProvider } from "../withStyleProvider";

const mockTheme = { colors: { brand: "ledger" } } as never;

function ThemeDisplay() {
  const theme = useTheme();
  return <span data-testid="theme">{JSON.stringify(theme)}</span>;
}

const WrappedDisplay = withStyleProvider(ThemeDisplay);

describe("withStyleProvider (web)", () => {
  it("renders the wrapped component", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <WrappedDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toBeInTheDocument();
  });

  it("re-injects the outer SC theme into the wrapped component", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <WrappedDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toContain("ledger");
  });
});
