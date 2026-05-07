import React from "react";
import { render, screen } from "@tests/test-renderer";
import { RequiredFirmwareUpdate } from "./rendering";
import { NavigatorName, ScreenName } from "~/const";
import { DeviceModelId } from "@ledgerhq/types-devices";
import * as useWalletFeaturesConfigModule from "@ledgerhq/live-common/featureFlags/index";
import type { WalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/types";
import type { State } from "~/reducers/types";

jest.mock("@ledgerhq/live-common/featureFlags/index");

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
  useTrack: () => jest.fn(),
  track: jest.fn(),
}));

const mockUseWalletFeaturesConfig = jest.mocked(
  useWalletFeaturesConfigModule.useWalletFeaturesConfig,
);

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

  it("should navigate to MyLedger via Main (not Base) when shouldDisplayWallet40MainNav is false", async () => {
    mockUseWalletFeaturesConfig.mockReturnValue({
      shouldDisplayWallet40MainNav: false,
    } as WalletFeaturesConfig);

    const { user } = render(
      <RequiredFirmwareUpdate navigation={mockNavigation} device={nanoX} />,
      { overrideInitialState: stateWithLastSeenDevice },
    );

    await user.press(screen.getByText("Go to My Ledger"));

    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: NavigatorName.Main,
          state: {
            routes: [
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
          },
        },
      ],
    });
    expect(mockReset.mock.calls[0][0].routes[0].name).not.toBe(NavigatorName.Base);
  });

  it("should navigate to MyLedger with wallet40 layout when shouldDisplayWallet40MainNav is true", async () => {
    mockUseWalletFeaturesConfig.mockReturnValue({
      shouldDisplayWallet40MainNav: true,
    } as WalletFeaturesConfig);

    const { user } = render(
      <RequiredFirmwareUpdate navigation={mockNavigation} device={nanoX} />,
      { overrideInitialState: stateWithLastSeenDevice },
    );

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
