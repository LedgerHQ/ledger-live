// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock("styled-components/native", () => ({
  ThemeProvider: ({ children }: any) => children,
  useTheme: jest.fn(() => ({})),
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { withStyleProvider } from "../withStyleProvider.native";

const mockTheme = { colors: { brand: "ledger" } } as never;

function Inner() {
  return <span data-testid="inner">native-wrapped</span>;
}

const Wrapped = withStyleProvider(Inner);

describe("withStyleProvider (native)", () => {
  it("renders the wrapped component", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <Wrapped />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("inner")).toBeInTheDocument();
  });

  it("wraps with ThemeProvider from styled-components/native", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <Wrapped />
      </ThemeProvider>,
    );
    expect(screen.getByText("native-wrapped")).toBeInTheDocument();
  });
});
