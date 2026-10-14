import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@tests/test-renderer";
import { useAppAvailability } from "@features/flow-app-availability";
import { State } from "~/reducers/types";
import { WaitForAppReady } from "../WaitForAppReady";

jest.mock("@features/flow-app-availability", () => ({
  ...jest.requireActual("@features/flow-app-availability"),
  useAppAvailability: jest.fn(() => ({ status: "available" })),
}));

const mockedUseAppAvailability = jest.mocked(useAppAvailability);

function renderApp(currencyInitialized: boolean, overrideInitialState?: (state: State) => State) {
  return render(
    <WaitForAppReady currencyInitialized={currencyInitialized}>
      <Text>App is Ready</Text>
    </WaitForAppReady>,
    { overrideInitialState },
  );
}

describe("WaitForAppReady", () => {
  beforeEach(() => {
    mockedUseAppAvailability.mockReturnValue({ status: "available" });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("renders children when app is fully ready", () => {
    // Default test state: remoteFlagsReady=true; availability settled; currency initialized
    renderApp(true);
    expect(screen.getByText("App is Ready")).toBeTruthy();
  });

  it("hides children while availability check is pending", () => {
    mockedUseAppAvailability.mockReturnValue({ status: "pending" });
    renderApp(true);
    expect(screen.queryByText("App is Ready")).toBeNull();
  });

  it("hides children while remote flags have not settled", () => {
    renderApp(true, state => ({
      ...state,
      featureFlags: { ...state.featureFlags, remoteFlagsReady: false },
    }));
    expect(screen.queryByText("App is Ready")).toBeNull();
  });

  it("hides children while currency is not initialized", () => {
    renderApp(false);
    expect(screen.queryByText("App is Ready")).toBeNull();
  });

  it("renders children when the availability check is unavailable", () => {
    mockedUseAppAvailability.mockReturnValue({
      status: "unavailable",
      reason: "serviceUnavailable",
    });

    renderApp(false);

    expect(screen.getByText("App is Ready")).toBeTruthy();
  });

  it("shows the unavailable screen after one second while the check is still pending", () => {
    jest.useFakeTimers();
    mockedUseAppAvailability.mockReturnValue({ status: "pending" });

    renderApp(false);
    expect(screen.queryByText("App is Ready")).toBeNull();
    expect(screen.queryByText("Ledger Wallet is currently unavailable")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(screen.queryByText("App is Ready")).toBeNull();
    expect(screen.getByText("Ledger Wallet is currently unavailable")).toBeTruthy();
  });
});
