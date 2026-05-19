import React from "react";
import { render as rntlRender, RenderOptions, RenderResult } from "@testing-library/react-native";
import { ThemeProvider } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";

function AllProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider themes={ledgerLiveThemes}>{children}</ThemeProvider>;
}

function render(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
  return rntlRender(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react-native";
export { render };
