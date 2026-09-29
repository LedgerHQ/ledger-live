import React from "react";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import TrackPage from "~/renderer/analytics/TrackPage";

import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { DeviceIntentTrackingTestWrapper } from "../testUtils";
import { UnknownErrorState } from "./UnknownErrorState";

jest.mock("~/renderer/analytics/TrackPage", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockedTrackPage = jest.mocked(TrackPage);

function renderState(error: unknown = new Error("boom")) {
  return render(
    <UnknownErrorState state={{ type: ConnectDeviceUIStateTypes.UnknownError, error }} />,
    { wrapper: DeviceIntentTrackingTestWrapper },
  );
}

describe("UnknownErrorState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN an unexpected error escapes WHEN rendering THEN it shows the generic intent error copy", () => {
    // WHEN
    renderState();

    // THEN
    expect(screen.getByText("Unknown error")).toBeVisible();
    expect(
      screen.getByText("Try again or contact Ledger support if the issue continues."),
    ).toBeVisible();
  });

  it("GIVEN an unexpected DMK error WHEN rendering THEN it tracks the page with the error tag as subError", () => {
    // WHEN
    renderState({ _tag: "TransportNotSupportedError" });

    // THEN
    expect(mockedTrackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.UnknownError,
        subError: "TransportNotSupportedError",
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
