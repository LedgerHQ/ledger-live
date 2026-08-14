import React from "react";
import { DeviceIntentTrackingProvider, RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../utils/trackDeviceIntent";
import { initializerDevice } from "../testUtils";
import { DeviceBusyState } from "./DeviceBusyState";

jest.mock("../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);

describe("DeviceBusyState", () => {
  const renderState = () => {
    const retry = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <DeviceBusyState
          state={{ type: RetryableStateType.DeviceBusy, retry }}
          device={initializerDevice}
          onCancel={onCancel}
        />
      </DeviceIntentTrackingProvider>,
    );
    return { user, retry, onCancel };
  };

  it("GIVEN the device busy state WHEN rendering THEN it shows the pending action copy", () => {
    // GIVEN
    renderState();

    // THEN
    expect(screen.getByText("Action pending on your Ledger device")).toBeVisible();
  });

  it("GIVEN the device busy state WHEN clicking Retry THEN it calls retry", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.Retry,
      extraProperties: {},
    });
  });

  it("GIVEN the device busy state WHEN clicking Cancel operation THEN it calls cancel", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Cancel operation" }));

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(retry).not.toHaveBeenCalled();
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: {},
    });
  });
});
