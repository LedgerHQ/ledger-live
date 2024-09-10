/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import { BitcoinPage } from "./shared";

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

describe("displayBitcoinPage", () => {
  it("should display Bitcoin page with rare sats and inscriptions", async () => {
    const { user } = render(<BitcoinPage />, {
      initialRoute: `/`,
    });

    await waitFor(() => expect(screen.getByText(/inscription #63691311/i)).toBeVisible());
    await waitFor(() => expect(screen.getByTestId(/raresaticon-palindrome-0/i)).toBeVisible());
    await user.hover(screen.getByTestId(/raresaticon-palindrome-0/i));
    await waitFor(() => expect(screen.getByText(/in a playful twist/i)).toBeVisible());
    await waitFor(() =>
      expect(
        screen.getByText(/block 9 \/ first transaction \/ nakamoto \/ vintage/i),
      ).toBeVisible(),
    );
    await waitFor(() => expect(screen.getByText(/see more inscriptions/i)).toBeVisible());
    await user.click(screen.getByText(/see more inscriptions/i));
    await waitFor(() => expect(screen.getByText(/timechain #136/i)).toBeVisible());
    await waitFor(() => expect(screen.getByTestId(/raresaticon-jpeg-0/i)).toBeVisible());
    await user.hover(screen.getByTestId(/raresaticon-jpeg-0/i));
    await waitFor(() => expect(screen.getByText(/journey into the past with jpeg/i)).toBeVisible());
  });
});
