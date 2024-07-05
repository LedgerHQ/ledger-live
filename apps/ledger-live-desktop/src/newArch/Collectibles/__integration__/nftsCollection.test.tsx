/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testUtils";
import { account, NftCollectionTest, NoNftCollectionTest } from "./shared";

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

describe("displayNftCollection", () => {
  it("should display NFTs collection", async () => {
    render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
        overriddenFeatureFlagsSelector: {
          nftsFromSimplehash: false,
        },
      },
      initialRoute: `/`,
    });

    await expect(screen.getByText(/0x670fd103b1a08628e9557cd66b87ded841115190/i)).toBeVisible();
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
  });

  it("it should open the NFTs gallery", async () => {
    const { user } = render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
        overriddenFeatureFlagsSelector: {
          nftsFromSimplehash: false,
        },
      },
      initialRoute: `/`,
    });

    await expect(screen.getByText(/0x670fd103b1a08628e9557cd66b87ded841115190/i)).toBeVisible();
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
    await user.click(screen.getByText(/see gallery/i));
    await expect(screen.getByText(/all nft/i)).toBeVisible();
  });

  it("it should open the corresponding NFTs collection and it should open detail drawer", async () => {
    const { user } = render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
        overriddenFeatureFlagsSelector: {
          nftsFromSimplehash: false,
        },
      },
      initialRoute: `/`,
    });

    await expect(screen.getByText(/0x670fd103b1a08628e9557cd66b87ded841115190/i)).toBeVisible();
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
    await user.click(screen.getByText(/0x670fd103b1a08628e9557cd66b87ded841115190/i));
    await expect(screen.getByText(/all nft/i)).toBeVisible();
    await expect(screen.getByText(/0x670fd103b1a08628e9557cd66b87ded841115190/i)).toBeVisible();
  });

  it("it should not display nft", async () => {
    render(<NoNftCollectionTest />, {
      initialState: {
        accounts: [account],
        overriddenFeatureFlagsSelector: {
          nftsFromSimplehash: false,
        },
      },
      initialRoute: `/`,
    });

    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/learn more/i)).toBeVisible();
  });
});
