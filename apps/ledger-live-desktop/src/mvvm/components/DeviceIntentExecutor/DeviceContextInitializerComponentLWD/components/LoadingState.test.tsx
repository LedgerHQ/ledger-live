import React from "react";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import { act, screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import TrackPage from "~/renderer/analytics/TrackPage";
import { initializerDevice } from "../testUtils";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { LoadingState } from "./LoadingState";

jest.mock("~/renderer/analytics/TrackPage", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockedTrackPage = jest.mocked(TrackPage);

describe("LoadingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderState = () =>
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <LoadingState device={initializerDevice} />
      </DeviceIntentTrackingProvider>,
    );

  it("should render the loading title", () => {
    renderState();
    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("should not track a loading page event before the dwell threshold", () => {
    jest.useFakeTimers();
    renderState();

    act(() => {
      jest.advanceTimersByTime(249);
    });

    expect(mockedTrackPage).not.toHaveBeenCalled();
  });

  it("should track the loading page event after the dwell threshold", () => {
    jest.useFakeTimers();
    renderState();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(mockedTrackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.Loading,
        sourceFlow: "my_ledger",
        modelId: initializerDevice.modelId,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
