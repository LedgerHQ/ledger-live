import React from "react";
import { render } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BlockingStateType } from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { initializerDevice } from "../testUtils";
import { DeviceDeprecatedBlockingState } from "./DeviceDeprecatedBlockingState";

jest.mock("~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen", () => ({
  DeviceDeprecationScreens: {
    clearSigningScreen: 0,
    warningScreen: 1,
    errorScreen: 2,
  },
  DeviceDeprecationScreen: jest.fn(() => null),
}));

const mockedDeviceDeprecationScreen = jest.mocked(DeviceDeprecationScreen);

describe("DeviceDeprecatedBlockingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN a blocking deprecation decision WHEN rendering THEN it wires the desktop error screen", () => {
    // GIVEN
    const supportEndDate = new Date("2026-01-01");

    // WHEN
    render(
      <DeviceDeprecatedBlockingState
        state={{
          type: BlockingStateType.DeviceDeprecatedBlocking,
          decision: {
            status: "block",
            currencyName: "Ethereum",
            deviceModelId: DeviceModelId.nanoX,
            supportEndDate,
          },
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
        productName: expect.stringContaining("Nano"),
        screenName: DeviceDeprecationScreens.errorScreen,
      }),
      undefined,
    );
  });
});
