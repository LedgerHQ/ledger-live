/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { BitcoinPage } from "./shared";
import { openURL } from "~/renderer/linking";
import { DeviceModelId } from "@ledgerhq/devices";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("displayBitcoinPage", () => {
  it("should display Bitcoin page with rare sats and inscriptions", async () => {
    const { user } = render(<BitcoinPage />, {
      initialState: {
        settings: {
          ...INITIAL_STATE_SETTINGS,
          hasSeenOrdinalsDiscoveryDrawer: true,
          devicesModelList: [DeviceModelId.stax, DeviceModelId.europa],
          hiddenOrdinalsAsset: [],
        },
      },
    });

    await waitFor(() => expect(screen.getByText(/the great war #3695/i)).toBeVisible());
    expect(screen.getByText(/see more inscriptions/i)).toBeVisible();
    await user.click(screen.getByText(/see more inscriptions/i));
    await user.click(screen.getByText(/see more inscriptions/i));
    expect(screen.getByText(/bitcoin puppet #71/i)).toBeVisible();
    expect(screen.getByTestId(/raresaticon-pizza-0/i)).toBeVisible();
    await user.hover(screen.getByTestId(/raresaticon-pizza-0/i));
    expect(screen.getByText(/papa john's pizza/i)).toBeVisible();
  });

  it("should open discovery drawer when it is the first time feature is activated", async () => {
    const { user } = render(<BitcoinPage />);

    await waitFor(() => expect(screen.getByText(/discover ordinals/i)).toBeVisible());
    await user.click(screen.getByText(/learn more/i));
    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/academy/bitcoin-ordinals");
  });

  it("should open inscription detail drawer", async () => {
    const { user } = render(<BitcoinPage />, {
      initialState: {
        settings: {
          ...INITIAL_STATE_SETTINGS,
          hasSeenOrdinalsDiscoveryDrawer: true,
          devicesModelList: [DeviceModelId.stax, DeviceModelId.europa],
          hiddenOrdinalsAsset: [],
        },
      },
    });

    await waitFor(() => expect(screen.getByText(/the great war #3695/i)).toBeVisible());
    await user.click(screen.getByText(/the great war #3695/i));
    expect(screen.getByText(/hide/i)).toBeVisible();
    expect(screen.getByText(/dlngbapxjdv/i)).toBeVisible();
  });

  it("should open context menu", async () => {
    const { user } = render(<BitcoinPage />, {
      initialState: {
        settings: {
          ...INITIAL_STATE_SETTINGS,
          hasSeenOrdinalsDiscoveryDrawer: true,
          devicesModelList: [DeviceModelId.stax, DeviceModelId.europa],
          hiddenOrdinalsAsset: [],
        },
      },
    });

    await waitFor(() => expect(screen.getByText(/the great war #3695/i)).toBeVisible());
    await user.pointer({ keys: "[MouseRight>]", target: screen.getByText(/the great war #3695/i) });
    expect(screen.getByText(/hide inscription/i));
  });
});
