import React from "react";
import { render } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BlockingStateType, DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../utils/trackDeviceIntent";
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
jest.mock("../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedDeviceDeprecationScreen = jest.mocked(DeviceDeprecationScreen);
const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);

describe("DeviceDeprecatedBlockingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN a blocking deprecation decision WHEN rendering THEN it wires the desktop error screen", () => {
    // GIVEN
    const supportEndDate = new Date("2026-01-01");

    // WHEN
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
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
        />
      </DeviceIntentTrackingProvider>,
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

  it("GIVEN a blocking deprecation decision WHEN clicking CTAs THEN it tracks each CTA", () => {
    // GIVEN
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <DeviceDeprecatedBlockingState
          state={{
            type: BlockingStateType.DeviceDeprecatedBlocking,
            decision: {
              status: "block",
              currencyName: "Ethereum",
              deviceModelId: DeviceModelId.nanoX,
              supportEndDate: new Date("2026-01-01"),
            },
          }}
          device={initializerDevice}
          onCancel={jest.fn()}
        />
      </DeviceIntentTrackingProvider>,
    );
    const [[{ onUpgrade, onLearnMore }]] = mockedDeviceDeprecationScreen.mock.calls;

    // WHEN
    onUpgrade?.();
    onLearnMore?.();

    // THEN
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenNthCalledWith(1, {
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.DiscoverUpgradeProgram,
      extraProperties: {},
    });
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenNthCalledWith(2, {
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.LearnMore,
      extraProperties: {},
    });
  });
});
