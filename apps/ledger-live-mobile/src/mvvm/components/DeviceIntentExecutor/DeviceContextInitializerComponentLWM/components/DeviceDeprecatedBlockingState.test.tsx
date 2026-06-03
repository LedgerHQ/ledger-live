import React from "react";
import { render } from "@tests/test-renderer";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BlockingStateType } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { DeviceDeprecatedBlockingState } from "./DeviceDeprecatedBlockingState";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../types";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

jest.mock("~/components/DeviceAction/Screen/DeviceDeprecationScreen", () => {
  const actual = jest.requireActual("~/components/DeviceAction/Screen/DeviceDeprecationScreen");
  return {
    ...actual,
    DeviceDeprecationScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);
const mockedDeviceDeprecationScreen = jest.mocked(DeviceDeprecationScreen);

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

const supportEndDate = new Date("2026-01-01T00:00:00Z");

function renderState() {
  return render(
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
      sourceFlow="my_ledger"
      onCancel={jest.fn()}
    />,
  );
}

describe("DeviceDeprecatedBlockingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN the blocking deprecation state WHEN rendering THEN it renders the error screen with the decision details", () => {
    renderState();

    expect(mockedDeviceDeprecationScreen).toHaveBeenCalledTimes(1);
    expect(mockedDeviceDeprecationScreen.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        coinName: "Bitcoin",
        date: supportEndDate,
        productName: getDeviceModel(DeviceModelId.nanoS).productName,
        screenName: DeviceDeprecationScreens.errorScreen,
      }),
    );
  });

  it("GIVEN the blocking deprecation state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.DeviceDeprecatedBlocking,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.europa,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
