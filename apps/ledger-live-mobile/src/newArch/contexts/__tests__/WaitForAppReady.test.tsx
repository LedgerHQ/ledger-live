import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { InitialQueriesContext } from "../InitialQueriesContext";
import { WaitForAppReady } from "../WaitForAppReady";

type InitialQueriesValue = Parameters<typeof InitialQueriesContext.Provider>[0]["value"];

describe("WaitForAppReady", () => {
  it("renders children when app is ready", () => {
    renderApp({ firebaseIsReady: true, ofacResult: { blocked: false, isLoading: false } });
    expect(screen.getByText("App is Ready")).toBeTruthy();
  });

  it("renders null when firebase is not ready", () => {
    renderApp({ firebaseIsReady: false, ofacResult: { blocked: false, isLoading: false } });
    expect(screen.toJSON()).toBeNull();
  });

  it("renders null when OFAC check is loading", () => {
    renderApp({ firebaseIsReady: true, ofacResult: { blocked: false, isLoading: true } });
    expect(screen.toJSON()).toBeNull();
  });

  function renderApp(value: InitialQueriesValue) {
    return render(
      <InitialQueriesContext.Provider value={value}>
        <WaitForAppReady>
          <Text>App is Ready</Text>
        </WaitForAppReady>
      </InitialQueriesContext.Provider>,
    );
  }
});
