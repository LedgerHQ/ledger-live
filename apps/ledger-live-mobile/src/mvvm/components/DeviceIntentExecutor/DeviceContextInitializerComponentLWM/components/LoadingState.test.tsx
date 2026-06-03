import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { LoadingState } from "./LoadingState";
import type { InitializerDevice } from "../types";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.stax,
  name: "Lily's Ledger",
  productName: "Stax",
  wired: false,
};

function renderState() {
  return render(<LoadingState device={device} sourceFlow="my_ledger" />);
}

describe("LoadingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("GIVEN the loading state WHEN rendering THEN it renders the loading title", () => {
    renderState();

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("GIVEN the loading state WHEN rendering for less than 250ms THEN it does not fire the page event", () => {
    jest.useFakeTimers();
    renderState();

    act(() => {
      jest.advanceTimersByTime(249);
    });

    expect(mockedTrackScreen).not.toHaveBeenCalled();
  });

  it("GIVEN the loading state WHEN rendering for 250ms THEN it fires the page event with sourceFlow and modelId", () => {
    jest.useFakeTimers();
    renderState();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.Loading,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.stax,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
