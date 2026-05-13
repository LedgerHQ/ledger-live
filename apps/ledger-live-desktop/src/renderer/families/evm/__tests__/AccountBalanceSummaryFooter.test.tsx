import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import * as currencies from "@ledgerhq/live-common/currencies/index";

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({
    name: "celo",
    code: "CELO",
    magnitude: 18,
  })),
}));
jest.mock("@ledgerhq/live-common/currencies/index");

const footerProps = {
  counterValue: { ticker: "USD", units: [{ code: "USD", magnitude: 2 }] } as unknown as Currency,
  discreetMode: false,
};

describe("EVM AccountBalanceSummaryFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing for token accounts", () => {
    const tokenAccount = { type: "TokenAccount" } as unknown as Parameters<
      typeof AccountBalanceSummaryFooter
    >[0]["account"];
    const { container } = render(
      <AccountBalanceSummaryFooter account={tokenAccount} {...footerProps} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the native staking feature flag is disabled", () => {
    const account = {
      type: "Account",
      currency: { id: "celo", family: "evm" } as CryptoCurrency,
      spendableBalance: new BigNumber(10),
      balance: new BigNumber(10),
      stakingResources: {
        delegatedBalance: new BigNumber(3),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
        delegations: [],
        redelegations: [],
        unbondings: [],
      },
    } as unknown as Account;
    const { container } = render(<AccountBalanceSummaryFooter account={account} {...footerProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows available and delegated from staking resources for supported currencies", () => {
    jest.spyOn(currencies, "formatCurrencyUnit").mockImplementation((_unit, value) => {
      if (value instanceof BigNumber && value.eq(3)) return "3 CELO delegated";
      if (value instanceof BigNumber && value.eq(5)) return "5 CELO derived";
      if (value instanceof BigNumber && value.eq(7)) return "7 CELO available";
      return String(value);
    });

    const account = {
      type: "Account",
      currency: { id: "celo", family: "evm" } as CryptoCurrency,
      spendableBalance: new BigNumber(7),
      balance: new BigNumber(12),
      stakingResources: {
        delegatedBalance: new BigNumber(3),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(2),
        delegations: [],
        redelegations: [],
        unbondings: [],
      },
    } as unknown as Account;

    render(<AccountBalanceSummaryFooter account={account} {...footerProps} />, {
      initialState: withFlagOverrides({
        evmNativeStaking: { enabled: true, params: { supportedCurrencyIds: ["celo"] } },
      }),
    });

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("Delegated assets")).toBeInTheDocument();
    expect(screen.getByText("7 CELO available")).toBeInTheDocument();
    expect(screen.getByText("3 CELO delegated")).toBeInTheDocument();
    expect(screen.queryByText("5 CELO derived")).not.toBeInTheDocument();
  });
});
