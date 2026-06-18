import React, { type ComponentType } from "react";
import { render as rntlRender, RenderOptions, RenderResult } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { DevToolsShellProvider, type CategoryGroup } from "../../src/context";

function ThemeProviders({ children }: { readonly children: React.ReactNode }) {
  return <ThemeProvider themes={ledgerLiveThemes}>{children}</ThemeProvider>;
}

function NavigationProviders({ children }: { readonly children: React.ReactNode }) {
  return (
    <ThemeProviders>
      <NavigationContainer>{children}</NavigationContainer>
    </ThemeProviders>
  );
}

/** Default render */
function render(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
  return rntlRender(ui, { wrapper: ThemeProviders, ...options });
}

/**
 * Render wrapped in a NavigationContainer.
 */
function renderWithNavigation(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return rntlRender(ui, { wrapper: NavigationProviders, ...options });
}

type ScreenProps = { readonly route: { readonly params?: unknown } };

/**
 * Render a single route screen in isolation. Only providing setOptions and push.
 */
function renderScreen<P extends ScreenProps>(
  Screen: ComponentType<P>,
  { categories = [], params }: { categories?: CategoryGroup[]; params?: P["route"]["params"] } = {},
) {
  const navigation = { setOptions: jest.fn(), push: jest.fn() };
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const props = { navigation, route: { params } } as unknown as P;
  const result = renderWithNavigation(
    <DevToolsShellProvider value={{ categories }}>
      <Screen {...props} />
    </DevToolsShellProvider>,
  );
  return { navigation, ...result };
}

export * from "@testing-library/react-native";
export { render, renderWithNavigation, renderScreen };
