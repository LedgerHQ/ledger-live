import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import LocationDisabled from "./LocationDisabled";

describe("LocationDisabled", () => {
  let sendIntentSpy: jest.SpyInstance;

  beforeEach(() => {
    sendIntentSpy = jest.spyOn(Linking, "sendIntent").mockResolvedValue(undefined);
  });

  afterEach(() => {
    sendIntentSpy.mockRestore();
  });

  it("opens the Android location settings when there is no retry callback", () => {
    render(<LocationDisabled />);

    fireEvent.press(screen.getByText("Open location settings"));

    expect(sendIntentSpy).toHaveBeenCalledWith("android.settings.LOCATION_SOURCE_SETTINGS");
  });

  it("opens the Android location settings when forced, even with a retry callback", () => {
    const onRetry = jest.fn();
    render(<LocationDisabled onRetry={onRetry} forceOpenSettings />);

    fireEvent.press(screen.getByText("Open location settings"));

    expect(sendIntentSpy).toHaveBeenCalledWith("android.settings.LOCATION_SOURCE_SETTINGS");
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("opens the app settings when the location settings cannot be opened", async () => {
    sendIntentSpy.mockRejectedValue(new Error("Could not launch Intent"));
    const openSettingsSpy = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    render(<LocationDisabled />);

    fireEvent.press(screen.getByText("Open location settings"));

    await waitFor(() => expect(openSettingsSpy).toHaveBeenCalledTimes(1));
    openSettingsSpy.mockRestore();
  });

  it("calls the retry callback instead of opening the settings", () => {
    const onRetry = jest.fn();
    render(<LocationDisabled onRetry={onRetry} />);

    fireEvent.press(screen.getByText("Try enabling location again"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(sendIntentSpy).not.toHaveBeenCalled();
  });
});
