import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@tests/test-renderer";
import { useAppAvailability } from "@features/flow-app-availability";
import { hide as hideSplashScreen } from "expo-splash-screen";
import { State } from "~/reducers/types";
import { startupEvents } from "../../utils/logStartupTime";
import { WaitForAppReady } from "../WaitForAppReady";

jest.mock("@features/flow-app-availability", () => ({
  useAppAvailability: jest.fn(() => ({ status: "available" })),
}));

const mockedUseAppAvailability = jest.mocked(useAppAvailability);
const logged = () => startupEvents.map(e => e.event);

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

  it("renders children after the one second timeout while still waiting", () => {
    jest.useFakeTimers();
    mockedUseAppAvailability.mockReturnValue({ status: "pending" });

    renderApp(false);
    expect(screen.queryByText("App is Ready")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(screen.getByText("App is Ready")).toBeTruthy();
  });

  it("leaves the native splash screen to the app when the app is available", () => {
    renderApp(true);
    expect(hideSplashScreen).not.toHaveBeenCalled();
  });

  it("hides the native splash screen when the app is unavailable", () => {
    mockedUseAppAvailability.mockReturnValue({ status: "unavailable", reason: "geoBlocked" });
    renderApp(true);
    expect(hideSplashScreen).toHaveBeenCalledTimes(1);
  });

  it("keeps the native splash screen while it still waits on an unavailable app", () => {
    mockedUseAppAvailability.mockReturnValue({ status: "unavailable", reason: "geoBlocked" });
    renderApp(false);
    expect(hideSplashScreen).not.toHaveBeenCalled();
  });

  describe("readiness startup events", () => {
    beforeEach(() => {
      startupEvents.splice(0);
    });

    it("logs each condition once, when it is first met", () => {
      const { rerender } = renderApp(true);
      rerender(
        <WaitForAppReady currencyInitialized>
          <Text>App is Ready</Text>
        </WaitForAppReady>,
      );
      for (const event of [
        "WaitForAppReady currencies ready",
        "WaitForAppReady remote flags ready",
        "WaitForAppReady availability checked",
      ]) {
        expect(logged().filter(e => e === event)).toHaveLength(1);
      }
      expect(logged()).not.toContain("WaitForAppReady timed out");
    });

    it("logs the timeout when it ends the wait, and not the condition still pending", () => {
      jest.useFakeTimers();
      mockedUseAppAvailability.mockReturnValue({ status: "pending" });

      renderApp(true);
      act(() => {
        jest.advanceTimersByTime(1_000);
      });

      expect(logged()).toContain("WaitForAppReady timed out");
      expect(logged()).toContain("WaitForAppReady currencies ready");
      expect(logged()).not.toContain("WaitForAppReady availability checked");
    });
  });
});
