import React from "react";
import { render, screen } from "@tests/test-renderer";
import { RequiredFirmwareUpdate } from "./rendering";
import { NavigatorName, ScreenName } from "~/const";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { State } from "~/reducers/types";

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

  it("should navigate to My Wallet", async () => {
    const { user } = render(<RequiredFirmwareUpdate navigation={mockNavigation} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    await user.press(screen.getByText("Go to My Ledger"));

    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            index: 1,
            routes: [
              { name: NavigatorName.Main },
              {
                name: NavigatorName.MyWallet,
                state: {
                  routes: [
                    {
                      name: ScreenName.MyWallet,
                      params: { device: nanoX, firmwareUpdate: true },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });
});
