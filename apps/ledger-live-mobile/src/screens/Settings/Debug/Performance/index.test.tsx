import React from "react";
import { NativeModules } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { startupEvents, startupFirstImportTime } from "LLM/utils/logStartupTime";
import { clearStartupOriginCache, STARTUP_EVENTS } from "LLM/utils/resolveStartupEvents";
import Performance from "./index";

jest.mock("../../SettingsNavigationScrollView", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

describe("Debug Performance screen", () => {
  const originalDev = __DEV__;

  beforeEach(() => {
    startupEvents.splice(0);
    clearStartupOriginCache();
  });

  afterEach(() => {
    Object.defineProperty(global, "__DEV__", { value: originalDev, configurable: true });
    jest.restoreAllMocks();
  });

  it("shows the startup time and each startup event relative to the JS start", () => {
    startupEvents.push(
      { event: STARTUP_EVENTS.APP_STARTED, time: startupFirstImportTime + 120 },
      { event: STARTUP_EVENTS.NAV_READY, time: startupFirstImportTime + 340 },
      { event: "Custom step", time: startupFirstImportTime + 500 },
    );

    render(<Performance />);

    expect(screen.getByText("App started (x1)")).toBeOnTheScreen();
    expect(screen.getByText("Splash screen faded (x1)")).toBeOnTheScreen();
    expect(screen.getByText("Custom step (x1)")).toBeOnTheScreen();
    expect(screen.getAllByText("340 ms")).toHaveLength(2);
  });

  it("says the startup time counts from the JS start when the native time is not available", () => {
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });

    render(<Performance />);

    expect(
      screen.getByText(
        "Time from the JS start to being interactive to the user (the native initialization time is not available)",
      ),
    ).toBeOnTheScreen();
  });

  it("says dev builds leave out the native initialization time", () => {
    render(<Performance />);

    expect(
      screen.getByText(
        "Time from the JS start to being interactive to the user (dev builds leave out the native initialization time)",
      ),
    ).toBeOnTheScreen();
  });

  it("counts from the app process start in release builds", () => {
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    jest
      .spyOn(NativeModules.AppStartupModule, "getProcessStartTime")
      .mockReturnValue(startupFirstImportTime - 1000);
    startupEvents.push({ event: STARTUP_EVENTS.NAV_READY, time: startupFirstImportTime + 340 });

    render(<Performance />);

    expect(
      screen.getByText("Time from the app process start to being interactive to the user"),
    ).toBeOnTheScreen();
    expect(screen.getAllByText("1340 ms")).toHaveLength(2);
  });

  it("shows a zero startup time when the app has not finished starting", () => {
    render(<Performance />);

    expect(screen.getByText("0 ms")).toBeOnTheScreen();
  });
});
