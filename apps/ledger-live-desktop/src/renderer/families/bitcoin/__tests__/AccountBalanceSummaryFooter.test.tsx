import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

jest.mock("~/renderer/hooks/useAccountUnit");

const mockedUseAccountUnit = jest.mocked(useAccountUnit);

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
      expect(screen.getByRole("button", { name: "Show balance" })).toBeInTheDocument();
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
      expect(screen.queryByRole("button", { name: "Show balance" })).not.toBeInTheDocument();
    });
  });
});
