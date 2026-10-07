import React from "react";
import { render } from "@tests/test-renderer";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { TrackScreen } from "@shared/analytics-react";
import { DeviceIntentTrackingProvider } from "../../utils/DeviceIntentTrackingContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { UnknownErrorState } from "./UnknownErrorState";

const mockedTrackScreen = jest.mocked(TrackScreen);

function renderState(error: unknown = new Error("boom")) {
  return render(
    <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
      <UnknownErrorState state={{ type: ConnectDeviceUIStateTypes.UnknownError, error }} />
    </DeviceIntentTrackingProvider>,
  );
}

describe("UnknownErrorState (DIE tracking)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
