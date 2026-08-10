import React from "react";
import { render } from "tests/testSetup";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import TrackPage from "~/renderer/analytics/TrackPage";
import { TrackDIEScreen } from "./TrackDIEScreen";

jest.mock("~/renderer/analytics/TrackPage", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockedTrackPage = jest.mocked(TrackPage);

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

    expect(mockedTrackPage).toHaveBeenCalledWith(
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
