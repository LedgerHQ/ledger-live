import React from "react";
import { render, screen } from "@tests/test-renderer";
import { startupEvents, startupFirstImportTime } from "LLM/utils/logStartupTime";
import { STARTUP_EVENTS } from "LLM/utils/resolveStartupEvents";
import Performance from "./index";

jest.mock("../../SettingsNavigationScrollView", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

describe("Debug Performance screen", () => {
  beforeEach(() => {
    startupEvents.splice(0);
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

  it("shows a zero startup time when the app has not finished starting", () => {
    render(<Performance />);

    expect(screen.getByText("0 ms")).toBeOnTheScreen();
  });
});
