import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { TrackScreen, track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { UserRefusedOnDeviceState } from "./UserRefusedOnDeviceState";
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
      <UserRefusedOnDeviceState
        state={{ type: RetryableStateType.UserRefusedOnDevice, retry }}
        device={device}
        sourceFlow="my_ledger"
        onCancel={onCancel}
      />,
    ),
    retry,
    onCancel,
  };
}

describe("UserRefusedOnDeviceState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
  });

  it("GIVEN the user refused state WHEN rendering THEN it renders the title and action buttons", () => {
    renderState();

    expect(screen.getByText("Operation rejected on device")).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
  });

  it("GIVEN the user refused state WHEN pressing the action buttons THEN it calls onCancel and retry", async () => {
    const { user, onCancel, retry } = renderState();

    await user.press(screen.getByText("Close"));
    await user.press(screen.getByText("Retry"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("GIVEN the user refused state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.UserRefused,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.europa,
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN the user refused state WHEN pressing Close THEN it tracks the canonical button value", async () => {
    const { user } = renderState();

    await user.press(screen.getByText("Close"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Close",
    });
  });

  it("GIVEN the user refused state WHEN pressing Retry THEN it tracks the canonical button value", async () => {
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
