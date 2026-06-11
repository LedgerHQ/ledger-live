import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BlockingStateType } from "@ledgerhq/live-dmk-shared";
import { TrackScreen, track } from "~/analytics";
import { DeviceDeprecatedBlockingState } from "./DeviceDeprecatedBlockingState";
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
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it("GIVEN the blocking deprecation state WHEN rendering THEN it renders the error screen with the decision details", () => {
    renderState();

    expect(
      screen.getByText(
        `${getDeviceModel(DeviceModelId.nanoS).productName}™ does not support this feature`,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Upgrade to a more recent Ledger device today to ensure access to all the latest Ledger Live features.",
      ),
    ).toBeVisible();
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

  it("GIVEN the blocking deprecation state WHEN pressing Learn More THEN it tracks the canonical button value", async () => {
    // GIVEN
    const { user } = renderState();

    // WHEN
    await user.press(screen.getByText("Learn more"));

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Learn More",
    });
  });

  it("GIVEN the blocking deprecation state WHEN pressing the upgrade CTA THEN it tracks the canonical button value", async () => {
    // GIVEN
    const { user } = renderState();

    // WHEN
    await user.press(screen.getByText("Discover your Upgrade Program"));

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Discover Upgrade Program",
    });
  });
});
