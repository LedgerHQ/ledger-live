import React from "react";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { render, screen } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const";
import { OsUpdateBanner } from "./index";

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
});
