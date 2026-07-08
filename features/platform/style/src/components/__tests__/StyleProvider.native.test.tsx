// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock("styled-components/native", () => ({ ThemeProvider: ({ children }: any) => children }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock("@ledgerhq/lumen-ui-rnative", () => ({ ThemeProvider: ({ children }: any) => children }));
jest.mock("@ledgerhq/lumen-design-core", () => ({ ledgerLiveThemes: {} }));

import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "../StyleProvider.native";

const mockTheme = {} as never;

describe("StyleProvider (native)", () => {
  it("renders children with light palette", () => {
    render(
      <StyleProvider theme={mockTheme} selectedPalette="light" locale="en">
        <span>native light</span>
      </StyleProvider>,
    );
    expect(screen.getByText("native light")).toBeInTheDocument();
  });

  it("renders children with dark palette", () => {
    render(
      <StyleProvider theme={mockTheme} selectedPalette="dark" locale="fr">
        <span>native dark</span>
      </StyleProvider>,
    );
    expect(screen.getByText("native dark")).toBeInTheDocument();
  });
});
