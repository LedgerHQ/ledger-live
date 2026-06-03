import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { TrackScreen, track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { RetryableDeviceLockedState } from "./RetryableDeviceLockedState";
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
      <RetryableDeviceLockedState
        state={{ type: RetryableStateType.DeviceLocked, retry }}
        device={device}
        sourceFlow="my_ledger"
        onCancel={onCancel}
      />,
    ),
    retry,
    onCancel,
  };
}

describe("RetryableDeviceLockedState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
  });

  it("GIVEN the retryable device locked state WHEN rendering THEN it renders the locked title and retry CTA", () => {
    renderState();

    expect(screen.getByText("Device is locked")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
  });

  it("GIVEN the retryable device locked state WHEN pressing retry THEN it calls retry", async () => {
    const { user, retry } = renderState();

    await user.press(screen.getByText("Retry"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("GIVEN the retryable device locked state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.DeviceLocked,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.europa,
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN the retryable device locked state WHEN pressing retry THEN it tracks the canonical button value", async () => {
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
});
