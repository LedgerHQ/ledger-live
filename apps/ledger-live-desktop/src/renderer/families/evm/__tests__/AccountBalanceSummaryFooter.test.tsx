import React from "react";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { Account } from "@ledgerhq/types-live";
import { Currency } from "@domain/entity-currency";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import * as currencies from "@ledgerhq/live-common/currencies/index";

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({
    name: "celo",
    code: "CELO",
    magnitude: 18,
  })),
}));
jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
}));

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
    const { container } = render(
      <AccountBalanceSummaryFooter account={account} {...footerProps} />,
    );
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

  it("shows the undelegating amount when some assets are unbonding", () => {
    jest.spyOn(currencies, "formatCurrencyUnit").mockImplementation((_unit, value) => {
      if (value instanceof BigNumber && value.eq(2)) return "2 CELO undelegating";
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

    expect(screen.getByText("Undelegating")).toBeInTheDocument();
    expect(screen.getByText("2 CELO undelegating")).toBeInTheDocument();
  });

  it("interpolates the SEI unbonding period into the undelegating tooltip", async () => {
    jest.spyOn(currencies, "formatCurrencyUnit").mockImplementation((_unit, value) => {
      if (value instanceof BigNumber && value.eq(2)) return "2 SEI undelegating";
      return String(value);
    });

    const account = {
      type: "Account",
      currency: { id: "sei_evm", family: "evm" } as CryptoCurrency,
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

    const { user } = render(<AccountBalanceSummaryFooter account={account} {...footerProps} />, {
      initialState: withFlagOverrides({
        evmNativeStaking: { enabled: true, params: { supportedCurrencyIds: ["sei_evm"] } },
      }),
    });

    await user.hover(screen.getByText("Undelegating"));

    // The 21 days come from the coin-evm staking config, not from a literal here.
    await waitFor(() => {
      const tooltips = screen.getAllByText(
        "Undelegated assets are in a timelock of 21 days, before being available.",
      );
      expect(tooltips.some(el => el.closest("[role='tooltip']"))).toBe(true);
    });
  });

  it("hides the undelegating tile when nothing is unbonding", () => {
    const account = {
      type: "Account",
      currency: { id: "celo", family: "evm" } as CryptoCurrency,
      spendableBalance: new BigNumber(7),
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

    render(<AccountBalanceSummaryFooter account={account} {...footerProps} />, {
      initialState: withFlagOverrides({
        evmNativeStaking: { enabled: true, params: { supportedCurrencyIds: ["celo"] } },
      }),
    });

    expect(screen.getByText("Delegated assets")).toBeInTheDocument();
    expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
  });
});
