/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import { BitcoinPage } from "./shared";
import { openURL } from "~/renderer/linking";

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
          hasSeenOrdinalsDiscoveryDrawer: true,
        },
      },
    });

    await waitFor(() => expect(screen.getByText(/the great war #3695/i)).toBeVisible());
    await waitFor(() => expect(screen.getByText(/see more inscriptions/i)).toBeVisible());
    await user.click(screen.getByText(/see more inscriptions/i));
    await user.click(screen.getByText(/see more inscriptions/i));
    await waitFor(() => expect(screen.getByText(/bitcoin puppet #71/i)).toBeVisible());
    await waitFor(() => expect(screen.queryAllByTestId(/raresaticon-pizza-0/i)).toHaveLength(2));
    await user.hover(screen.queryAllByTestId(/raresaticon-pizza-0/i)[0]);
    await waitFor(() => expect(screen.getByText(/papa john's pizza/i)).toBeVisible());
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
          hasSeenOrdinalsDiscoveryDrawer: true,
        },
      },
    });

    await waitFor(() => expect(screen.getByText(/the great war #3695/i)).toBeVisible());
    await user.click(screen.getByText(/the great war #3695/i));
    await expect(screen.getByText(/hide/i)).toBeVisible();
    // sat name
    await expect(screen.getByText(/dlngbapxjdv/i)).toBeVisible();
  });
});
