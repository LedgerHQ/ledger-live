import React from "react";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import TrackPage from "~/renderer/analytics/TrackPage";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { initializerDevice } from "../testUtils";
import { InstallingAppState } from "./InstallingAppState";

jest.mock("~/renderer/analytics/TrackPage", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockedTrackPage = jest.mocked(TrackPage);

describe("InstallingAppState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderState = () =>
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <InstallingAppState device={initializerDevice} />
      </DeviceIntentTrackingProvider>,
    );

  it("should render the installing app title", () => {
    renderState();
    expect(screen.getByText("Installing app")).toBeVisible();
  });

  it("should track the installing app page event", () => {
    renderState();

    expect(mockedTrackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.InstallingApp,
        sourceFlow: "my_ledger",
        modelId: initializerDevice.modelId,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
