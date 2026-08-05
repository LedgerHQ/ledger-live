import React, { type ComponentType, type ReactNode } from "react";
import { render, type RenderResult } from "@support/jest-devtools-fixtures/native";
import { NavigationContainer } from "@react-navigation/native";
import { DevToolsShellProvider, type CategoryGroup } from "../src/context";

function NavigationWrapper({ children }: { readonly children: ReactNode }) {
  return <NavigationContainer>{children}</NavigationContainer>;
}

/** Render wrapped in a NavigationContainer, nested inside the lumen ThemeProvider. */
function renderWithNavigation(ui: React.ReactElement): RenderResult {
  return render(ui, { wrapper: NavigationWrapper });
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

export * from "@support/jest-devtools-fixtures/native";
export { renderWithNavigation, renderScreen };
