import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { InitialQueriesContext } from "../InitialQueriesContext";
import { WaitForAppReady } from "../WaitForAppReady";

type RenderParams = Parameters<typeof InitialQueriesContext.Provider>[0]["value"] & {
  currencyInitialized: boolean;
};

describe("WaitForAppReady", () => {
  it("renders children when app is ready", () => {
    renderApp({
      currencyInitialized: true,
      firebaseIsReady: true,
      ofacResult: { blocked: false, isLoading: false },
    });
    expect(screen.getByText("App is Ready")).toBeTruthy();
  });

  it("renders null when firebase is not ready", () => {
    renderApp({
      currencyInitialized: true,
      firebaseIsReady: false,
      ofacResult: { blocked: false, isLoading: false },
    });
    expect(screen.toJSON()).toBeNull();
  });

  it("renders null when OFAC check is loading", () => {
    renderApp({
      currencyInitialized: true,
      firebaseIsReady: true,
      ofacResult: { blocked: false, isLoading: true },
    });
    expect(screen.toJSON()).toBeNull();
  });

  it("renders null when currency is not initialized", () => {
    renderApp({
      currencyInitialized: false,
      firebaseIsReady: true,
      ofacResult: { blocked: false, isLoading: false },
    });
    expect(screen.toJSON()).toBeNull();
  });

  function renderApp({ currencyInitialized, ...value }: RenderParams) {
    return render(
      <InitialQueriesContext.Provider value={value}>
        <WaitForAppReady currencyInitialized={currencyInitialized}>
          <Text>App is Ready</Text>
        </WaitForAppReady>
      </InitialQueriesContext.Provider>,
    );
  }
});
