import React from "react";
import { render } from "@tests/test-renderer";
import { TrackScreen } from "~/analytics";
import { DeviceIntentTrackingProvider } from "../utils/DeviceIntentTrackingContext";
import { TrackDIEScreen } from "./TrackDIEScreen";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

describe("TrackDIEScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN provider analytics properties WHEN rendering THEN it forwards them with canonical DIE properties", () => {
    // GIVEN
    const analyticsProperties = { manifestId: "app-id", manifestName: "My app" };

    // WHEN
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "wallet_api", analyticsProperties }}>
        <TrackDIEScreen category="Connect Device - Discovering" refreshSource />
      </DeviceIntentTrackingProvider>,
    );

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      {
        category: "Connect Device - Discovering",
        deviceUxV2: true,
        manifestId: "app-id",
        manifestName: "My app",
        refreshSource: true,
        sourceFlow: "wallet_api",
      },
      undefined,
    );
  });
});
