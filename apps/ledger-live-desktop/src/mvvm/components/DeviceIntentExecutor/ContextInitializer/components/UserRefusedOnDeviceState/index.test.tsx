import React from "react";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared/react";
import { screen } from "@testing-library/react";
import { TrackScreen } from "@shared/analytics-react";
import { render } from "tests/testSetup";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../../utils/trackDeviceIntent";
import { initializerDevice } from "../../testUtils";
import { UserRefusedOnDeviceState } from ".";

jest.mock("../../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackScreen: jest.fn(() => null),
}));

const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);
const mockedTrackScreen = jest.mocked(TrackScreen);

describe("UserRefusedOnDeviceState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderState = () => {
    const retry = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <UserRefusedOnDeviceState
          state={{ type: RetryableStateType.UserRefusedOnDevice, retry }}
          device={initializerDevice}
          onCancel={onCancel}
        />
      </DeviceIntentTrackingProvider>,
    );
    return { user, retry, onCancel };
  };

  it("GIVEN the user refused state WHEN rendering THEN it shows the operation rejected copy", () => {
    // GIVEN
    renderState();

    // THEN
    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
  });

  it("GIVEN the user refused state WHEN rendering THEN it tracks the Connect App refusal page", () => {
    // GIVEN
    renderState();

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      {
        category: PAGE_CONNECT_APP.UserRefused,
        modelId: initializerDevice.modelId,
        refreshSource: true,
        sourceFlow: "my_ledger",
        deviceUxV2: true,
      },
      undefined,
    );
  });

  it("GIVEN the user refused state WHEN clicking Close THEN it calls cancel", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Close" }));

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

  it("GIVEN the user refused state WHEN clicking Retry THEN it calls retry", async () => {
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
});
