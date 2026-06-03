import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { TrackScreen, track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { DeviceBusyState } from "./DeviceBusyState";
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
const TEST_SOURCE = "Portfolio";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

function renderState() {
  const retry = jest.fn();
  const onCancel = jest.fn();

  return {
    ...render(
      <DeviceBusyState
        state={{ type: RetryableStateType.DeviceBusy, retry }}
        device={device}
        sourceFlow="my_ledger"
        onCancel={onCancel}
      />,
    ),
    retry,
    onCancel,
  };
}

describe("DeviceBusyState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
  });

  it("GIVEN the device busy state WHEN rendering THEN it renders the title, description and action buttons", () => {
    renderState();

    expect(screen.getByText("Action pending on your Ledger device")).toBeVisible();
    expect(screen.getByText("Complete it and then select Retry.")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.getByText("Cancel operation")).toBeVisible();
  });

  it("GIVEN the device busy state WHEN pressing the action buttons THEN it calls retry and onCancel", async () => {
    const { user, retry, onCancel } = renderState();

    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Cancel operation"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("GIVEN the device busy state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.DeviceBusy,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.europa,
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN the device busy state WHEN pressing Retry THEN it tracks the canonical button value", async () => {
    const { user } = renderState();

    await user.press(screen.getByText("Retry"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Retry",
    });
  });

  it("GIVEN the device busy state WHEN pressing Cancel operation THEN it tracks the canonical button value", async () => {
    const { user } = renderState();

    await user.press(screen.getByText("Cancel operation"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Cancel",
    });
  });
});
