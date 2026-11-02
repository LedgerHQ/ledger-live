import React from "react";
import { render } from "tests/testSetup";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "@shared/analytics-react";
import { TrackDIEScreen } from "./TrackDIEScreen";

jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackScreen: jest.fn(() => null),
}));

const mockedTrackScreen = jest.mocked(TrackScreen);

describe("TrackDIEScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN provider analytics properties WHEN rendering THEN it forwards them with canonical DIE properties", () => {
    const analyticsProperties = { manifestId: "app-id", manifestName: "My app" };

    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "wallet_api", analyticsProperties }}>
        <TrackDIEScreen category="Device Action - Disconnected" refreshSource />
      </DeviceIntentTrackingProvider>,
    );

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      {
        category: "Device Action - Disconnected",
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
