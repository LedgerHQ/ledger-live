import React from "react";
import { render, screen } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import * as config from "@ledgerhq/live-common/config/index";
import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import * as currencies from "@ledgerhq/live-common/currencies/index";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain";
import { StakingTotalsSchema } from "@domain/entity-account-staking";
import { useStakingTotals } from "../useStakingTotals";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("../useStakingTotals");
jest.mock("@ledgerhq/live-common/currencies/index");
jest.mock("@ledgerhq/live-common/config/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/config/index"),
}));
// keep the real factory (real alias + per-chain params) but spy on the calls
jest.mock("@ledgerhq/live-common/families/cosmos/chain", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/families/cosmos/chain");
  return { __esModule: true, default: jest.fn(actual.default) };
});

describe("AccountBalanceSummaryFooter", () => {
  describe("Testing disableDelegation in currency config", () => {
    const DELEGATE_BALANCE = BigNumber(1);
    const DELEGATE_BALANCE_TEXT = "balance for test: " + DELEGATE_BALANCE;

    const DELEGATE_UNBONDING_BALANCE = BigNumber(2);
    const DELEGATE_UNBONDING_BALANCE_TEXT =
      "unbounding balance for test: " + DELEGATE_UNBONDING_BALANCE;

    const STAKING_RESOURCES = {
      delegatedBalance: DELEGATE_BALANCE,
      unbondingBalance: DELEGATE_UNBONDING_BALANCE,
    };

    const ACCOUNT = {
      type: "Account",
      currency: {
        id: "babylon",
      } as unknown as CryptoCurrency,
    } as unknown as CosmosAccount;

    beforeEach(() => {
      jest.clearAllMocks();
      mockStakingTotals(DELEGATE_BALANCE, DELEGATE_UNBONDING_BALANCE);
    });

    it("should display delegated balance and unbound balance when disableDelegation flag is false and unbound balance is greater than 0", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      mockFormatCurrencyUnit(
        STAKING_RESOURCES.delegatedBalance,
        STAKING_RESOURCES.unbondingBalance,
      );

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.getByText("Delegated assets")).toBeVisible();
      expect(screen.getByText(DELEGATE_BALANCE_TEXT)).toBeVisible();
      expect(screen.getByText("Undelegating")).toBeVisible();
      expect(screen.getByText(DELEGATE_UNBONDING_BALANCE_TEXT)).toBeVisible();
    });

    it("looks up the undelegation timelock from the chain factory by currency id, not a hardcoded constant", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      mockFormatCurrencyUnit(
        STAKING_RESOURCES.delegatedBalance,
        STAKING_RESOURCES.unbondingBalance,
      );

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);

      expect(cryptoFactory).toHaveBeenCalledWith("babylon");
    });

    it("should display delegated balance and not display unbound balance when disableDelegation flag is false and nothing is unbonding", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      mockStakingTotals(DELEGATE_BALANCE, BigNumber(0));
      mockFormatCurrencyUnit(DELEGATE_BALANCE, BigNumber(0));

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.getByText("Delegated assets")).toBeInTheDocument();
      expect(screen.getByText(DELEGATE_BALANCE_TEXT)).toBeInTheDocument();
      expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
      expect(screen.queryByText(DELEGATE_UNBONDING_BALANCE_TEXT)).not.toBeInTheDocument();
    });

    it("should count a withdrawable position as undelegating", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      mockStakingTotals(DELEGATE_BALANCE, BigNumber(0), DELEGATE_UNBONDING_BALANCE);
      mockFormatCurrencyUnit(DELEGATE_BALANCE, DELEGATE_UNBONDING_BALANCE);

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.getByText(DELEGATE_UNBONDING_BALANCE_TEXT)).toBeVisible();
    });

    it("should not display delegated balance and unbound balance when disableDelegation flag is true", () => {
      mockGetCurrencyConfiguration({ disableDelegation: true });
      mockFormatCurrencyUnit(
        STAKING_RESOURCES.delegatedBalance,
        STAKING_RESOURCES.unbondingBalance,
      );

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.queryByText("Delegated assets")).not.toBeInTheDocument();
      expect(screen.queryByText(DELEGATE_BALANCE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
      expect(screen.queryByText(DELEGATE_UNBONDING_BALANCE_TEXT)).not.toBeInTheDocument();
    });

    it("should show a dash for delegated and no undelegating while the staking is not read yet", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      jest.mocked(useStakingTotals).mockReturnValue(undefined);
      mockFormatCurrencyUnit(BigNumber(0), BigNumber(-1));

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.getByText("–")).toBeInTheDocument();
      expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
    });

    it("should render nothing for a token account", () => {
      const { container } = render(
        <AccountBalanceSummaryFooter
          account={{ type: "TokenAccount" } as unknown as CosmosAccount}
        />,
      );
      expect(container).toBeEmptyDOMElement();
      expect(useStakingTotals).not.toHaveBeenCalled();
    });

    it("should render the undelegating tooltip without throwing for a testnet id that aliases to a mainnet chain (crypto_org_croeseid)", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });

      const account = {
        type: "Account",
        currency: {
          id: "crypto_org_croeseid",
        } as unknown as CryptoCurrency,
      } as unknown as CosmosAccount;

      mockFormatCurrencyUnit(
        STAKING_RESOURCES.delegatedBalance,
        STAKING_RESOURCES.unbondingBalance,
      );

      expect(() => render(<AccountBalanceSummaryFooter account={account} />)).not.toThrow();
      expect(screen.getByText("Undelegating")).toBeVisible();
    });
  });
});

function mockGetCurrencyConfiguration(currencyConfig: { disableDelegation: boolean }) {
  jest
    .spyOn(config, "getCurrencyConfiguration")
    .mockReturnValue(currencyConfig as unknown as CurrencyConfig);
}

function mockStakingTotals(staked: BigNumber, unbonding: BigNumber, withdrawable = BigNumber(0)) {
  jest.mocked(useStakingTotals).mockReturnValue(
    StakingTotalsSchema.parse({
      assetId: "babylon",
      staked: staked.toFixed(),
      unbonding: unbonding.toFixed(),
      withdrawable: withdrawable.toFixed(),
      rewards: "0",
    }),
  );
}

function mockFormatCurrencyUnit(delegatedBalance: BigNumber, unboundBalance: BigNumber) {
  jest.spyOn(currencies, "formatCurrencyUnit").mockImplementation((_unit, value, _formatConfig) => {
    if (delegatedBalance.eq(value)) {
      return "balance for test: " + delegatedBalance.toString();
    } else if (unboundBalance.eq(value)) {
      return "unbounding balance for test: " + unboundBalance.toString();
    }

    return value?.toString();
  });
}
