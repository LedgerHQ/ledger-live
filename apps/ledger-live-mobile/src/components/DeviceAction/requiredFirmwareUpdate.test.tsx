import React from "react";
import { render, screen } from "@tests/test-renderer";
import { RequiredFirmwareUpdate } from "./rendering";
import { NavigatorName, ScreenName } from "~/const";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { State } from "~/reducers/types";

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
  useTrack: () => jest.fn(),
  track: jest.fn(),
}));

const nanoX = {
  modelId: DeviceModelId.nanoX,
  deviceId: "nanoX",
  wired: true,
};

const mockReset = jest.fn();
const mockNavigation = { reset: mockReset } as never;

const stateWithLastSeenDevice = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    seenDevices: [{ modelId: DeviceModelId.nanoX } as never],
  },
});

describe("RequiredFirmwareUpdate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should navigate to MyLedger", async () => {
    const { user } = render(<RequiredFirmwareUpdate navigation={mockNavigation} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    await user.press(screen.getByText("Go to My Ledger"));

    expect(mockReset).toHaveBeenCalledWith({
      index: 1,
      routes: [
        { name: NavigatorName.Main },
        {
          name: NavigatorName.MyLedger,
          state: {
            routes: [
              {
                name: ScreenName.MyLedgerChooseDevice,
                params: { device: nanoX, firmwareUpdate: true },
              },
            ],
          },
        },
      ],
    });
  });
});
