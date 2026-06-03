import React from "react";
import { render } from "@tests/test-renderer";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  AppInteractionRequiredStateType,
  type DeprecationScreenKind,
} from "@ledgerhq/live-dmk-shared";
import { TrackScreen, track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { DeviceDeprecatedNonBlockingState } from "./DeviceDeprecatedNonBlockingState";
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
    track: jest.fn(),
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
const mockedTrack = jest.mocked(track);
const mockedDeviceDeprecationScreen = jest.mocked(DeviceDeprecationScreen);
const TEST_SOURCE = "Portfolio";

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
      sourceFlow="my_ledger"
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
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
  });

  it.each(screenSequenceCases)(
    "GIVEN the $name screen sequence WHEN rendering THEN it renders the matching deprecation screen",
    ({ screenSequence, expectedScreenName, expectedDisplayClearSigningWarning }) => {
      renderState(screenSequence);

      expect(mockedDeviceDeprecationScreen).toHaveBeenCalledTimes(1);
      expect(mockedDeviceDeprecationScreen.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          coinName: "Bitcoin",
          date: supportEndDate,
          productName: getDeviceModel(DeviceModelId.nanoS).productName,
          screenName: expectedScreenName,
          displayClearSigningWarning: expectedDisplayClearSigningWarning,
        }),
      );
    },
  );

  it("GIVEN the non-blocking deprecation state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState(["warning"]);

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.DeviceDeprecatedWarning,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.europa,
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN the non-blocking deprecation state WHEN invoking continue THEN it tracks Continue and forwards to onContinue", () => {
    const { onContinue } = renderState(["warning"]);

    mockedDeviceDeprecationScreen.mock.calls[0][0].onContinue?.();

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Continue",
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
