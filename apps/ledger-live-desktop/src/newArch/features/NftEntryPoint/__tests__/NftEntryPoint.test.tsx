import React from "react";
import { useHistory } from "react-router-dom";

import { render, screen } from "tests/testSetup";
import NftEntryPoint from "..";
import { Entry } from "../types";
import { track } from "~/renderer/analytics/segment";

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

describe("NftEntryPoint", () => {
  it("should render nothing if isFeatureNftEntryPointEnabled is false", () => {
    const { store } = render(<NftEntryPoint chainId={"ETH"} />, {
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
    render(<NftEntryPoint chainId={"ETH"} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ETH"],
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
    render(<NftEntryPoint chainId={"ETH"} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ETH"],
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
    render(<NftEntryPoint chainId={"BTC"} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ETH", "SOL"],
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
    render(<NftEntryPoint chainId={"ETH"} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            llNftEntryPoint: {
              enabled: true,
              params: {
                chains: ["ETH"],
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
    expect(mockPush).toHaveBeenCalledWith("/platform/magic-eden");
  });
});
