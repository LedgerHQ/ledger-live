import React, { type ReactNode } from "react";
import { render as rtlRender, RenderOptions, RenderResult } from "@testing-library/react";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import type { Wrapper } from "./types";

function ThemeProviders({ children }: { readonly children: ReactNode }) {
  return <ThemeProvider colorScheme="dark">{children}</ThemeProvider>;
}

interface RenderConfig extends Omit<RenderOptions, "wrapper"> {
  /** Extra provider nested inside the ThemeProvider. */
  wrapper?: Wrapper;
}

/**
 * Render wrapped in the lumen ThemeProvider. Pass `wrapper` to nest an extra
 * provider inside it for components that need more context.
 */
function render(
  ui: React.ReactElement,
  { wrapper: ExtraWrapper, ...options }: RenderConfig = {},
): RenderResult {
  function Providers({ children }: { readonly children: ReactNode }) {
    return (
      <ThemeProviders>
        {ExtraWrapper ? <ExtraWrapper>{children}</ExtraWrapper> : children}
      </ThemeProviders>
    );
  }
  return rtlRender(ui, { wrapper: Providers, ...options });
}

export * from "@testing-library/react";
export { render };
export type { RenderConfig, Wrapper };
