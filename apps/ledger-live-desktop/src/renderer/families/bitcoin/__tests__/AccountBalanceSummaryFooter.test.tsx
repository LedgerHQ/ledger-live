import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/lib-es/fixtures/common.fixtures";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/featureFlags/index");

const mockedUseAccountUnit = jest.mocked(useAccountUnit);
const mockedUseFeatureFlags = jest.mocked(useFeatureFlags);

describe("Bitcoin Account Balance Summary Footer", () => {
  const account = createFixtureAccount();

  mockedUseFeatureFlags.mockReturnValue({
    getFeature: jest.fn(() => ({ enabled: true })),
    isFeature: jest.fn(),
    overrideFeature: jest.fn(),
    resetFeature: jest.fn(),
    resetFeatures: jest.fn(),
  });

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
