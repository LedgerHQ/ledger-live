import React, { type ComponentType, type ReactNode } from "react";
import { render as rntlRender, RenderOptions, RenderResult } from "@testing-library/react-native";
import { ThemeProvider, BottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";

type Wrapper = ComponentType<{ readonly children: ReactNode }>;

function ThemeProviders({ children }: { readonly children: ReactNode }) {
  return <ThemeProvider themes={ledgerLiveThemes}>{children}</ThemeProvider>;
}

interface RenderConfig extends Omit<RenderOptions, "wrapper"> {
  /** Extra provider nested inside the ThemeProvider, e.g. {@link BottomSheetWrapper}. */
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
  return rntlRender(ui, { wrapper: Providers, ...options });
}

/** Provides the lumen BottomSheet context required by BottomSheet sub-components. */
function BottomSheetWrapper({ children }: { readonly children: ReactNode }) {
  return <BottomSheet>{children}</BottomSheet>;
}

export * from "@testing-library/react-native";
export { render, BottomSheetWrapper };
