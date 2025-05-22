import React from "react";

import NftEntryPoint from "..";
import { Entry } from "../types";
import { track } from "~/analytics";
import { Account } from "@ledgerhq/types-live";
import { render, screen } from "@tests/test-renderer";
import { INITIAL_STATE } from "~/reducers/settings";
import { State } from "~/reducers/types";
import { useNavigation } from "@react-navigation/native";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));

const mockAccount = {
  id: "testAccountId",
  currency: { id: "ethereum" },
} as unknown as Account;

const mockAccountBTC = {
  id: "testAccountBTC",
  currency: { id: "bitcoin" },
} as unknown as Account;

const mockNavigate = jest.fn();
(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });

describe("NftEntryPoint", () => {
  it("should render nothing if isFeatureNftEntryPointEnabled is false", () => {
    const { store } = render(<NftEntryPoint account={mockAccount} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,

          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: false,
            },
          },
        },
      }),
    });
    expect(
      store.getState().settings.overriddenFeatureFlags.llNftEntryPoint?.enabled ?? false,
    ).toBeFalsy();
  });

  it("should render enabled entry points if enabled", () => {
    render(<NftEntryPoint account={mockAccount} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
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
      }),
    });

    expect(screen.getAllByTestId(/nft-entry-point/i).length).toEqual(2);
  });

  it("should not render disabled entry points if not enabled", () => {
    render(<NftEntryPoint account={mockAccount} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
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
      }),
    });

    expect(screen.getAllByTestId(/nft-entry-point/i).length).toEqual(1);
    expect(screen.getByTestId(`nft-entry-point-${Entry.magiceden}`)).toBeDefined();
  });

  it("should render nothing if chainId is not included in chains", () => {
    render(<NftEntryPoint account={mockAccountBTC} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
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
      }),
    });

    expect(screen.queryByTestId(/nft-entry-point/i)).toBeNull();
  });

  it("should call onClick when a Row is clicked", async () => {
    const { user } = render(<NftEntryPoint account={mockAccount} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...INITIAL_STATE,
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
      }),
    });

    const row = screen.getByTestId(`nft-entry-point-${Entry.magiceden}`);
    await user.press(row);

    expect(track).toHaveBeenCalledWith("entry_nft_clicked", {
      item: Entry.magiceden,
      page: "Account",
    });
    expect(mockNavigate).toHaveBeenCalledWith("Base", {
      screen: "PlatformApp",
      params: {
        platform: "nft-viewer-redirector",
        website: "https://magiceden.io",
        accountId: mockAccount.id,
        chainId: mockAccount.currency.id,
      },
    });
  });
});
