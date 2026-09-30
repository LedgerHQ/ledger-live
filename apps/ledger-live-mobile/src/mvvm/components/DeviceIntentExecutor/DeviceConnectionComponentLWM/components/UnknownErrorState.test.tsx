import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { TrackScreen } from "~/analytics";
import { DeviceIntentTrackingProvider } from "../../utils/DeviceIntentTrackingContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { UnknownErrorState } from "./UnknownErrorState";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

function renderState(error: unknown = new Error("boom")) {
  return render(
    <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
      <UnknownErrorState state={{ type: ConnectDeviceUIStateTypes.UnknownError, error }} />
    </DeviceIntentTrackingProvider>,
  );
}

describe("UnknownErrorState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the shared unknown error wording", () => {
    renderState();

    expect(screen.getByText("Unknown error")).toBeVisible();
    expect(
      screen.getByText("Try again or contact Ledger support if the issue continues."),
    ).toBeVisible();
    expect(screen.getByTestId("device-intent-executor-connect-device-unknown-error")).toBeVisible();
  });

  it("should track the page with the error tag as subError when a DMK error escapes", () => {
    renderState({ _tag: "TransportNotSupportedError" });

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.UnknownError,
        sourceFlow: "my_ledger",
        subError: "TransportNotSupportedError",
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
