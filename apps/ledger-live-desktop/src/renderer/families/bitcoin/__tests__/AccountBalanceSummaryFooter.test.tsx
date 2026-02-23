import React from "react";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/zcash-shielded/constants";
import { render, screen, waitFor } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

jest.mock("~/renderer/hooks/useAccountUnit");
const mockedUseAccountUnit = jest.mocked(useAccountUnit);

// Patch Date.prototype.toLocaleString with explicit typing to avoid "this" implicit any error.
const origDate = global.Date.prototype.toLocaleString;
jest.spyOn(global.Date.prototype, "toLocaleString").mockImplementation(function (this: Date) {
  return origDate.call(this, "en-GB");
});

describe("Bitcoin Account Balance Summary Footer", () => {
  const account = createFixtureAccount();

  it("should render a private balance field", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{ ...account, currency: { id: "zcash" } as CryptoCurrency }}
      />,
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              zcashShielded: {
                enabled: true,
              },
            },
          },
        },
      },
    );
    await waitFor(() => {
      expect(screen.getByText("Available balance")).toBeInTheDocument();
      expect(screen.getByText("Transparent balance")).toBeInTheDocument();
      expect(screen.getByText("Private balance")).toBeInTheDocument();
      expect(screen.getByTestId("show-private-balance-button")).toBeInTheDocument();
    });
  });

  it("should render the start sync button when the sync state is ready", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            syncState: "ready",
          },
        }}
      />,
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              zcashShielded: {
                enabled: true,
              },
            },
          },
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("start-sync-button")).toBeInTheDocument();
      expect(screen.queryByText(/last sync: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/i)).toBeNull();
    });
  });

  it("should render the last sync date when the sync state is complete", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    const now = new Date();

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            syncState: "complete",
            lastSyncTimestamp: now.getTime(),
          },
        }}
      />,
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              zcashShielded: {
                enabled: true,
              },
            },
          },
        },
      },
    );

    await waitFor(() => {
      expect(screen.queryByTestId("start-sync-button")).not.toBeInTheDocument();
      expect(
        screen.getByText(/last sync: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/i),
      ).toBeInTheDocument();
    });
  });

  it("should render the start sync button when the sync state is outdated", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            lastSyncTimestamp: new Date("2026-01-12T10:43:02").getTime(),
            syncState: "outdated",
          },
        }}
      />,
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              zcashShielded: {
                enabled: true,
              },
            },
          },
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("start-sync-button")).toBeInTheDocument();
      expect(screen.getByText(/last sync: 12\/01\/2026 10:43:02/i)).toBeInTheDocument();
    });
  });

  it("should not render a private balance field if the account is not a zcash account", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "BTC",
      name: "Bitcoin",
      magnitude: 8,
    });

    render(<AccountBalanceSummaryFooter account={account} />);
    await waitFor(() => {
      expect(screen.queryByText("Available balance")).not.toBeInTheDocument();
      expect(screen.queryByText("Transparent balance")).not.toBeInTheDocument();
      expect(screen.queryByText("Private balance")).not.toBeInTheDocument();
      expect(screen.queryByTestId("show-private-balance-button")).not.toBeInTheDocument();
    });
  });
});
