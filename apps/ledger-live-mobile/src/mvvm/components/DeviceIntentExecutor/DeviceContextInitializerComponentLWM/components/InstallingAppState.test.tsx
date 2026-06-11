import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { InstallingAppState } from "./InstallingAppState";
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
  return render(<InstallingAppState device={device} sourceFlow="my_ledger" />);
}

describe("InstallingAppState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN the installing app state WHEN rendering THEN it renders the installing app title", () => {
    renderState();

    expect(screen.getByText("Installing app")).toBeVisible();
  });

  it("GIVEN the installing app state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.InstallingApp,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.stax,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
