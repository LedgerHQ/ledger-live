// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock("styled-components/native", () => ({
  ThemeProvider: jest.fn(({ children }: any) => children),
  useTheme: jest.fn(),
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ThemeProvider as NativeThemeProvider,
  useTheme as nativeUseTheme,
} from "styled-components/native";
import { withStyleProvider } from "../withStyleProvider.native";

const mockTheme = { colors: { brand: "ledger" } };

function Inner() {
  return <span data-testid="inner">native-wrapped</span>;
}

const Wrapped = withStyleProvider(Inner);

describe("withStyleProvider (native)", () => {
  beforeEach(() => {
    jest.mocked(nativeUseTheme).mockReturnValue(mockTheme as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the wrapped component", () => {
    render(<Wrapped />);
    expect(screen.getByTestId("inner")).toBeVisible();
  });

  it("wraps with native ThemeProvider and passes the theme from useTheme", () => {
    render(<Wrapped />);
    expect(screen.getByText("native-wrapped")).toBeVisible();
    const calls = (NativeThemeProvider as unknown as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toMatchObject({ theme: mockTheme });
  });
});
