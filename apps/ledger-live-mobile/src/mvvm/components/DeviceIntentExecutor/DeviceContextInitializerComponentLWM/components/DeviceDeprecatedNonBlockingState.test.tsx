import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  AppInteractionRequiredStateType,
  type DeprecationScreenKind,
} from "@ledgerhq/live-dmk-shared";
import { TrackScreen, track } from "~/analytics";
import { DeviceDeprecatedNonBlockingState } from "./DeviceDeprecatedNonBlockingState";
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

const mockedTrackScreen = jest.mocked(TrackScreen);
const mockedTrack = jest.mocked(track);

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
  expectedTitle: RegExp;
}[] = [
  {
    name: "warning + clearSigning",
    screenSequence: ["warning", "clearSigning"],
    expectedTitle: /Bitcoin support on Ledger Nano S™ via Ledger Live™ will end/,
  },
  {
    name: "warning only",
    screenSequence: ["warning"],
    expectedTitle: /Bitcoin support on Ledger Nano S™ via Ledger Live™ will end/,
  },
  {
    name: "clearSigning only",
    screenSequence: ["clearSigning"],
    expectedTitle: /Ledger Nano S™ can not Clear Sign this transaction/,
  },
  {
    name: "empty sequence",
    screenSequence: [],
    expectedTitle: /Ledger Nano S™ can not Clear Sign this transaction/,
  },
];

describe("DeviceDeprecatedNonBlockingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it.each(screenSequenceCases)(
    "GIVEN the $name screen sequence WHEN rendering THEN it renders the matching deprecation screen",
    ({ screenSequence, expectedTitle }) => {
      renderState(screenSequence);

      expect(screen.getByText(expectedTitle)).toBeVisible();
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

  it("GIVEN the non-blocking deprecation state WHEN pressing Continue THEN it tracks Continue and forwards to onContinue", async () => {
    const { onContinue, user } = renderState(["warning"]);

    await user.press(screen.getByTestId("enabled-warning-deprecation-continue"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Continue",
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("GIVEN the non-blocking deprecation state WHEN pressing the upgrade CTA THEN it tracks the canonical button value", async () => {
    const { user } = renderState(["warning"]);

    await user.press(screen.getByText("Discover your Upgrade Program"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Discover Upgrade Program",
    });
  });
});
