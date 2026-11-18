import React from "react";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { render, screen } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { OsUpdateBanner } from "./index";

// Wraps the real sheet to observe whether the banner asks for it to be open.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const sheetProps = () => jest.mocked(QueuedBottomSheet).mock.lastCall?.[0];

const mockNavigate = jest.fn();
const mockUseRoute = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => mockUseRoute(),
}));

const lastConnectedDevice = { deviceId: "usb|1", modelId: "stax", wired: true };
const osUpdate = { finalFirmware: { version: "1.8.0" } } as OsUpdate;

const overrideInitialState = (state: State): State => ({
  ...state,
  deviceOsUpdate: { osUpdates: [osUpdate], hasBackup: false },
  appstate: { ...state.appstate, hasConnectedDevice: true },
  settings: {
    ...state.settings,
    hasCompletedOnboarding: true,
    lastConnectedDevice: lastConnectedDevice as State["settings"]["lastConnectedDevice"],
  },
});

describe("OsUpdateBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("goes to My Ledger with the last device, asking it to open the update, from the portfolio", async () => {
    mockUseRoute.mockReturnValue({ name: ScreenName.Portfolio });
    const { user } = render(<OsUpdateBanner />, { overrideInitialState });

    await user.press(screen.getByTestId("os-update-banner"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      screen: ScreenName.MyWallet,
      params: { device: lastConnectedDevice, firmwareUpdate: true },
    });
  });

  it("opens the OS update flow from My Ledger", async () => {
    mockUseRoute.mockReturnValue({ name: ScreenName.MyLedgerDevice });
    const { user } = render(<OsUpdateBanner />, { overrideInitialState });

    await user.press(screen.getByText("Update"));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OsUpdate, {
      device: expect.objectContaining({ id: "usb|1", deviceModelId: "stax" }),
    });
  });

  describe("on a Nano X that cannot update over Bluetooth", () => {
    const nanoX = { deviceId: "ble|1", modelId: "nanoX", wired: false };
    const unsupportedState = (state: State): State => {
      const base = overrideInitialState(state);
      return {
        ...base,
        settings: {
          ...base.settings,
          lastConnectedDevice: nanoX as State["settings"]["lastConnectedDevice"],
          seenDevices: [
            { modelId: "nanoX", deviceInfo: { version: "2.2.3" } },
          ] as State["settings"]["seenDevices"],
        },
      };
    };

    it.each([
      [ScreenName.Portfolio, () => screen.getByTestId("os-update-banner")],
      [ScreenName.MyLedgerDevice, () => screen.getByText("Update")],
    ])(
      "opens the update on desktop sheet instead of the flow from %s",
      async (routeName, target) => {
        mockUseRoute.mockReturnValue({ name: routeName });
        const { user } = render(<OsUpdateBanner />, { overrideInitialState: unsupportedState });
        expect(sheetProps()?.isRequestingToBeOpened).toBe(false);

        await user.press(target());

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(sheetProps()?.isRequestingToBeOpened).toBe(true);
      },
    );

    it("closes the sheet on got it", async () => {
      mockUseRoute.mockReturnValue({ name: ScreenName.Portfolio });
      const { user } = render(<OsUpdateBanner />, { overrideInitialState: unsupportedState });
      await user.press(screen.getByTestId("os-update-banner"));

      await user.press(screen.getByText("Got it"));

      expect(sheetProps()?.isRequestingToBeOpened).toBe(false);
    });
  });
});
