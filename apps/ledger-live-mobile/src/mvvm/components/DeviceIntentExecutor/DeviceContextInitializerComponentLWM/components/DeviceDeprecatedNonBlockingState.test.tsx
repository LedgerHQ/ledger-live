import React from "react";
import { render } from "@tests/test-renderer";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  AppInteractionRequiredStateType,
  type DeprecationScreenKind,
} from "@ledgerhq/live-dmk-shared";
import { DeviceDeprecatedNonBlockingState } from "./DeviceDeprecatedNonBlockingState";
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

function renderState(screenSequence: DeprecationScreenKind[]) {
  const onContinue = jest.fn();
  const view = render(
    <DeviceDeprecatedNonBlockingState
      state={{
        type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking,
        decision: {
          status: "show",
          screenSequence,
          currencyName: "Bitcoin",
          deviceModelId: DeviceModelId.nanoS,
          supportEndDate,
        },
        onContinue,
      }}
      device={device}
      onCancel={jest.fn()}
    />,
  );
  return { ...view, onContinue };
}

const screenSequenceCases: {
  name: string;
  screenSequence: DeprecationScreenKind[];
  expectedScreenName: DeviceDeprecationScreens;
  expectedDisplayClearSigningWarning: boolean;
}[] = [
  {
    name: "warning + clearSigning",
    screenSequence: ["warning", "clearSigning"],
    expectedScreenName: DeviceDeprecationScreens.warningScreen,
    expectedDisplayClearSigningWarning: true,
  },
  {
    name: "warning only",
    screenSequence: ["warning"],
    expectedScreenName: DeviceDeprecationScreens.warningScreen,
    expectedDisplayClearSigningWarning: false,
  },
  {
    name: "clearSigning only",
    screenSequence: ["clearSigning"],
    expectedScreenName: DeviceDeprecationScreens.clearSigningScreen,
    expectedDisplayClearSigningWarning: true,
  },
  {
    name: "empty sequence",
    screenSequence: [],
    expectedScreenName: DeviceDeprecationScreens.clearSigningScreen,
    expectedDisplayClearSigningWarning: false,
  },
];

describe("DeviceDeprecatedNonBlockingState", () => {
  beforeEach(() => {
    mockedDeviceDeprecationScreen.mockClear();
  });

  it.each(screenSequenceCases)(
    "should render the deprecation screen for sequence: $name",
    ({ screenSequence, expectedScreenName, expectedDisplayClearSigningWarning }) => {
      const { onContinue } = renderState(screenSequence);

      expect(mockedDeviceDeprecationScreen).toHaveBeenCalledTimes(1);
      expect(mockedDeviceDeprecationScreen.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          coinName: "Bitcoin",
          date: supportEndDate,
          onContinue,
          productName: getDeviceModel(DeviceModelId.nanoS).productName,
          screenName: expectedScreenName,
          displayClearSigningWarning: expectedDisplayClearSigningWarning,
        }),
      );
    },
  );
});
