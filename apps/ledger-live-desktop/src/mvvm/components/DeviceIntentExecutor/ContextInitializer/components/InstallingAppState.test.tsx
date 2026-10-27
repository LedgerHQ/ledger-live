import React from "react";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { TrackScreen } from "@shared/analytics-react";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { initializerDevice } from "../testUtils";
import { InstallingAppState } from "./InstallingAppState";

jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackScreen: jest.fn(() => null),
}));

const mockedTrackScreen = jest.mocked(TrackScreen);

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

    expect(mockedTrackScreen).toHaveBeenCalledWith(
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
