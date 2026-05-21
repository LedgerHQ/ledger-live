import React from "react";
import { render, screen } from "@tests/test-renderer";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BlockingStateType } from "@ledgerhq/live-dmk-shared";
import { DeviceDeprecatedBlockingState } from "./DeviceDeprecatedBlockingState";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/components/DeviceAction/Screen/DeviceDeprecationScreen";
import type { InitializerDevice } from "../types";

jest.mock("~/components/DeviceAction/Screen/DeviceDeprecationScreen", () => {
  const actual = jest.requireActual("~/components/DeviceAction/Screen/DeviceDeprecationScreen");
  return {
    ...actual,
    DeviceDeprecationScreen: jest.fn(() => null),
  };
});

const mockedDeviceDeprecationScreen = jest.mocked(DeviceDeprecationScreen);

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

const supportEndDate = new Date("2026-01-01T00:00:00Z");

describe("DeviceDeprecatedBlockingState", () => {
  beforeEach(() => {
    mockedDeviceDeprecationScreen.mockClear();
  });

  it("should render the deprecation error screen with the decision details", () => {
    render(
      <DeviceDeprecatedBlockingState
        state={{
          type: BlockingStateType.DeviceDeprecatedBlocking,
          decision: {
            status: "block",
            currencyName: "Bitcoin",
            deviceModelId: DeviceModelId.nanoS,
            supportEndDate,
          },
        }}
        device={device}
        onCancel={jest.fn()}
      />,
    );

    expect(mockedDeviceDeprecationScreen).toHaveBeenCalledTimes(1);
    expect(mockedDeviceDeprecationScreen.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        coinName: "Bitcoin",
        date: supportEndDate,
        productName: getDeviceModel(DeviceModelId.nanoS).productName,
        screenName: DeviceDeprecationScreens.errorScreen,
      }),
    );
    expect(screen.toJSON()).toBeNull();
  });
});
