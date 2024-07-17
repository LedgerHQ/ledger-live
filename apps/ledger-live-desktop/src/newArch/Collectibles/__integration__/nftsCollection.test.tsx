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

jest.mock("@ledgerhq/live-nft-react", () => ({
  useNftCollectionMetadata: () => ({
    metadata: {
      contract: "0x4229fb41559289527a483599a18ffd0305a0ded7",
      tokenId: "97",
      tokenName: "Art On Ledger Stax Mint Pass",
      nftName: "#97",
      media:
        "https://ldg.mo.cloudinary.net/stg/preview/ethereum/1/0x4229fb41559289527a483599a18ffd0305a0ded7/97?resource_type=video",
      medias: {
        preview: {
          uri: "https://ldg.mo.cloudinary.net/stg/preview/ethereum/1/0x4229fb41559289527a483599a18ffd0305a0ded7/97?resource_type=video",
          mediaType: "image/png",
        },
        big: {
          uri: "https://ldg.mo.cloudinary.net/stg/big/ethereum/1/0x4229fb41559289527a483599a18ffd0305a0ded7/97?resource_type=video",
          mediaType: "video/mp4",
        },
        original: {
          uri: "https://ldg.mo.cloudinary.net/stg/original/ethereum/1/0x4229fb41559289527a483599a18ffd0305a0ded7/97?resource_type=video",
          mediaType: "video/mp4",
        },
      },
      description: null,
      tokenNameThumbnail: null,
      properties: [],
      links: {
        rarible: "https://rarible.com/token/0x4229fb41559289527a483599a18ffd0305a0ded7:97",
        opensea: "https://opensea.io/assets/ethereum/0x4229fb41559289527a483599a18ffd0305a0ded7/97",
        explorer: "https://etherscan.io/nft/0x4229fb41559289527a483599a18ffd0305a0ded7/97",
        etherscan: "https://etherscan.io/nft/0x4229fb41559289527a483599a18ffd0305a0ded7/97",
      },
      staxImage: null,
    },
    status: "loaded",
  }),
}));

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

  it("should open the NFTs gallery", async () => {
    const { user } = render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
        overriddenFeatureFlagsSelector: {
          nftsFromSimplehash: false,
        },
      },
      initialRoute: `/`,
    });

    await new Promise(resolve => setTimeout(resolve, 10000));

    await expect(screen.getByText(/0x670fd103b1a08628e9557cd66b87ded841115190/i)).toBeVisible();
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
    await user.click(screen.getByText(/see gallery/i));
    await expect(screen.getByText(/all nft/i)).toBeVisible();
    // Check breadcrumb and page title
    await expect(screen.getAllByText(/nft/i).length).toBe(2);
  });

  it("should open the corresponding NFTs collection and it should open detail drawer", async () => {
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
    // Check breadcrumb and page title
    await expect(screen.getAllByText(/0x670fd103b1a08628e9557cd66b87ded841115190/i).length).toBe(2);
  });

  it("should not display nft", async () => {
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
