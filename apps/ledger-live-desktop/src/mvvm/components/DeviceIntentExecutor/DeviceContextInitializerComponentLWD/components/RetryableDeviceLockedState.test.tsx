import React from "react";
import { DeviceIntentTrackingProvider, RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../utils/trackDeviceIntent";
import { initializerDevice } from "../testUtils";
import { RetryableDeviceLockedState } from "./RetryableDeviceLockedState";

jest.mock("../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);

describe("RetryableDeviceLockedState", () => {
  const renderState = () => {
    const retry = jest.fn();
    const { user } = render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <RetryableDeviceLockedState
          state={{ type: RetryableStateType.DeviceLocked, retry }}
          device={initializerDevice}
          onCancel={jest.fn()}
        />
      </DeviceIntentTrackingProvider>,
    );
    return { user, retry };
  };

  it("GIVEN the retryable device locked state WHEN rendering THEN it shows the device locked copy", () => {
    // GIVEN
    renderState();

    // THEN
    expect(screen.getByText("Unlock your Ledger device and then select Retry below")).toBeVisible();
  });

  it("GIVEN the retryable device locked state WHEN clicking Retry THEN it calls retry", async () => {
    // GIVEN
    const { user, retry } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.Retry,
      extraProperties: {},
    });
  });
});
