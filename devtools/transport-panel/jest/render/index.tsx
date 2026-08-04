import React from "react";
import { render as rtlRender, RenderOptions, RenderResult } from "@testing-library/react";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";

interface AllProvidersProps {
  readonly children: React.ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  return <ThemeProvider colorScheme="dark">{children}</ThemeProvider>;
}

function render(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { render };
