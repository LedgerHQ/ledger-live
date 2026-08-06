import React from "react";
import { render } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { AppInteractionRequiredStateType } from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen";
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

const mockedDeviceDeprecationScreen = jest.mocked(DeviceDeprecationScreen);

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
      />,
    );

    // THEN
    expect(mockedDeviceDeprecationScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        coinName: "Ethereum",
        date: supportEndDate,
        onContinue,
        productName: expect.stringContaining("Nano"),
        screenName: DeviceDeprecationScreens.warningScreen,
        displayClearSigningWarning: true,
      }),
      undefined,
    );
  });
});
