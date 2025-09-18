import React from "react";
import { useHistory } from "react-router-dom";

import { render, screen } from "tests/testSetup";
import NftEntryPoint from "..";
import { Entry } from "../types";
import { track } from "~/renderer/analytics/segment";
import { Account } from "@ledgerhq/types-live";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: jest.fn(),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

const mockPush = jest.fn();
(useHistory as jest.Mock).mockReturnValue({ push: mockPush });

const mockAccount = {
  id: "testAccountId",
  currency: { id: "ethereum" },
} as unknown as Account;

const mockAccountBTC = {
  id: "testAccountBTC",
  currency: { id: "bitcoin" },
} as unknown as Account;

describe("NftEntryPoint", () => {
  it("should render nothing if isFeatureNftEntryPointEnabled is false", () => {
    const { store } = render(<NftEntryPoint account={mockAccount} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: false,
            },
          },
        },
      },
    });
    expect(store.getState().settings.overriddenFeatureFlags.llNftEntryPoint.enabled).toBeFalsy();
  });

  it("should render enabled entry points if enabled", () => {
    render(<NftEntryPoint account={mockAccount} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ethereum"],
                [Entry.magiceden]: true,
                [Entry.opensea]: true,
              },
            },
          },
        },
      },
    });

    expect(screen.getAllByTestId(/nft-entry-point/i).length).toEqual(2);
  });

  it("should not render disabled entry points if not enabled", () => {
    render(<NftEntryPoint account={mockAccount} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ethereum"],
                [Entry.magiceden]: true,
                [Entry.opensea]: false,
              },
            },
          },
        },
      },
    });

    expect(screen.getAllByTestId(/nft-entry-point/i).length).toEqual(1);
    expect(screen.getByTestId(`nft-entry-point-${Entry.magiceden}`)).toBeDefined();
  });

  it("should render nothing if chainId is not included in chains", () => {
    render(<NftEntryPoint account={mockAccountBTC} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ethereum", "solana"],
                [Entry.magiceden]: true,
                [Entry.opensea]: true,
              },
            },
          },
        },
      },
    });

    expect(screen.queryByTestId(/nft-entry-point/i)).toBeNull();
  });

  it("should call onClick when a Row is clicked", () => {
    render(<NftEntryPoint account={mockAccount} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ethereum"],
                [Entry.magiceden]: true,
              },
            },
          },
        },
      },
    });

    const row = screen.getByTestId(`nft-entry-point-${Entry.magiceden}`);
    row.click();

    expect(track).toHaveBeenCalledWith("entry_nft_clicked", {
      item: Entry.magiceden,
      page: "Account",
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/platform/nft-viewer-redirector",
      state: {
        accountId: mockAccount.id,
        chainId: mockAccount.currency.id,
        returnTo: `/account/${mockAccount.id}`,
        website: "https://magiceden.io",
      },
    });
  });
});
