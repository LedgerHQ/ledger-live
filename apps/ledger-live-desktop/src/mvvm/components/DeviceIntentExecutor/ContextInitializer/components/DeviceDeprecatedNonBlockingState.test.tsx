import React from "react";
import { render } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  AppInteractionRequiredStateType,
  DeviceIntentTrackingProvider,
} from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../utils/trackDeviceIntent";
import { initializerDevice } from "../testUtils";
import { DeviceDeprecatedNonBlockingState } from "./DeviceDeprecatedNonBlockingState";

jest.mock("~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen", () => ({
  DeviceDeprecationScreens: {
    clearSigningScreen: 0,
    warningScreen: 1,
    errorScreen: 2,
  },
  DeviceDeprecationScreen: jest.fn(() => null),
}));
jest.mock("../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedDeviceDeprecationScreen = jest.mocked(DeviceDeprecationScreen);
const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);

describe("DeviceDeprecatedNonBlockingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN warning and clear-signing screens WHEN rendering THEN it wires the desktop deprecation screen", () => {
    // GIVEN
    const onContinue = jest.fn();
    const supportEndDate = new Date("2026-01-01");

    // WHEN
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <DeviceDeprecatedNonBlockingState
          state={{
            type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking,
            decision: {
              status: "show",
              screenSequence: ["warning", "clearSigning"],
              currencyName: "Ethereum",
              deviceModelId: DeviceModelId.nanoX,
              supportEndDate,
            },
            onContinue,
          }}
          device={initializerDevice}
          onCancel={jest.fn()}
        />
      </DeviceIntentTrackingProvider>,
    );

    // THEN
    expect(mockedDeviceDeprecationScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        coinName: "Ethereum",
        date: supportEndDate,
        onContinue: expect.any(Function),
        productName: expect.stringContaining("Nano"),
        screenName: DeviceDeprecationScreens.warningScreen,
        displayClearSigningWarning: true,
      }),
      undefined,
    );
  });

  it("GIVEN a non-blocking deprecation decision WHEN clicking CTAs THEN it tracks each CTA and continues", () => {
    // GIVEN
    const onContinue = jest.fn();
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <DeviceDeprecatedNonBlockingState
          state={{
            type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking,
            decision: {
              status: "show",
              screenSequence: ["warning"],
              currencyName: "Ethereum",
              deviceModelId: DeviceModelId.nanoX,
              supportEndDate: new Date("2026-01-01"),
            },
            onContinue,
          }}
          device={initializerDevice}
          onCancel={jest.fn()}
        />
      </DeviceIntentTrackingProvider>,
    );
    const [[{ onContinue: onContinueClick, onUpgrade, onLearnMore }]] =
      mockedDeviceDeprecationScreen.mock.calls;

    // WHEN
    onContinueClick?.();
    onUpgrade?.();
    onLearnMore?.();

    // THEN
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenNthCalledWith(1, {
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.Continue,
      extraProperties: {},
    });
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenNthCalledWith(2, {
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.DiscoverUpgradeProgram,
      extraProperties: {},
    });
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenNthCalledWith(3, {
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.LearnMore,
      extraProperties: {},
    });
  });
});
