/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { NftCollectionTest } from "./shared";
import { account as ethAccount, solAccount } from "./mocks/mockedAccount";
import { mockNftCollectionStatusByNetwork } from "~/renderer/hooks/nfts/__tests__/shared";

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

jest.mock("@ledgerhq/live-nft-react", () => ({
  ...jest.requireActual("@ledgerhq/live-nft-react"),
  NftMetadataProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("displayNftCollection for Solana", () => {
  it("should not display receive CTA for solana account and lldSolanaNfts feature enabled", async () => {
    render(<NftCollectionTest account={solAccount} />, {
      initialState: {
        settings: {
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
          overriddenFeatureFlags: {
            lldSolanaNfts: {
              enabled: true,
            },
          },
        },
      },
      initialRoute: `/`,
    });
    const receiveCTA = screen.queryByText(/receive nft/i);
    expect(receiveCTA).not.toBeInTheDocument();
  });
  it("should not display Learn more text for solana account (empty of nfts) and lldSolanaNfts feature enabled", async () => {
    render(<NftCollectionTest account={{ ...solAccount, nfts: [] }} />, {
      initialState: {
        settings: {
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
          overriddenFeatureFlags: {
            lldSolanaNfts: {
              enabled: true,
            },
          },
        },
      },
      initialRoute: `/`,
    });
    const learnMoreTxt = screen.queryByText(/learn more/i);
    expect(learnMoreTxt).not.toBeInTheDocument();
  });
  it("should not display Collections for solana account and lldSolanaNfts feature disabled", async () => {
    render(<NftCollectionTest account={solAccount} />, {
      initialState: {
        settings: {
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
          overriddenFeatureFlags: {
            lldSolanaNfts: {
              enabled: false,
            },
          },
        },
      },
      initialRoute: `/`,
    });
    const collectionsContainer = screen.queryByTestId("nft-collections");
    expect(collectionsContainer).not.toBeInTheDocument();
  });

  it("should display receive CTA", async () => {
    render(<NftCollectionTest account={ethAccount} />, {
      initialState: {
        settings: {
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
          overriddenFeatureFlags: {
            lldSolanaNfts: {
              enabled: false,
            },
          },
        },
      },
      initialRoute: `/`,
    });
    const receiveCTA = screen.queryByText(/receive nft/i);
    expect(receiveCTA).toBeInTheDocument();
  });

  it("should display learn more text for eth account without nfts", async () => {
    render(<NftCollectionTest account={{ ...ethAccount, nfts: [] }} />, {
      initialState: {
        settings: {
          nftCollectionsStatusByNetwork: mockNftCollectionStatusByNetwork,
          overriddenFeatureFlags: {
            lldSolanaNfts: {
              enabled: false,
            },
          },
        },
      },
      initialRoute: `/`,
    });
    const learnMoreTxt = screen.queryByText(/learn more/i);
    expect(learnMoreTxt).toBeInTheDocument();
  });
});
