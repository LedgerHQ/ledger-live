/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import { NftCollectionTest, NoNftCollectionTest } from "./shared";
import { account } from "./mockedAccount";

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

describe("displayNftCollection", () => {
  it("should display NFTs collections", async () => {
    render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    await waitFor(() => expect(screen.getByText(/momentum/i)).toBeVisible());
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
    await expect(screen.getByText(/see more collections/i)).toBeVisible();
  });

  it("should open the NFTs gallery", async () => {
    const { user } = render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    await waitFor(() => expect(screen.getByText(/momentum/i)).toBeVisible());
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
    await user.click(screen.getByText(/see gallery/i));
    await expect(screen.getByText(/all nft/i)).toBeVisible();
  });

  it("should open the corresponding NFTs collection and the correct detail drawer", async () => {
    const { user } = render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    // Check initial state
    await waitFor(() => expect(screen.getByText(/momentum/i)).toBeVisible());

    // Open specific collection
    await user.click(screen.getByText(/momentum/i));
    await waitFor(() => expect(screen.getByText(/ID: 35/i)).toBeVisible());

    // Open Detail drawer
    await user.click(screen.getByText(/ID: 35/i));
    await screen.findByTestId("side-drawer-container");
    await screen.findByTestId("drawer-close-button");
    await screen.findByText(/properties/i);

    // Open external viewer
    await user.click(screen.getByTestId("external-viewer-button"));
    await expect(screen.getByText(/open in opensea.io/i)).toBeVisible();

    // Close drawer
    await waitFor(() => user.click(screen.getByTestId("drawer-close-button")));
    await waitFor(() => expect(screen.queryByTestId("side-drawer-container")).toBeNull());
  });

  it("should not display nft", async () => {
    render(<NoNftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/learn more/i)).toBeVisible();
  });
});
