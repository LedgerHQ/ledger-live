import React from "react";
import { render, screen } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import * as config from "@ledgerhq/live-common/config/index";
import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import * as currencies from "@ledgerhq/live-common/currencies/index";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/currencies/index");
jest.mock("@ledgerhq/live-common/config/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/config/index"),
}));
// keep the real factory (real alias + per-chain params) but spy on the calls
jest.mock("@ledgerhq/coin-cosmos/chain/chain", () => {
  const actual = jest.requireActual("@ledgerhq/coin-cosmos/chain/chain");
  return { __esModule: true, default: jest.fn(actual.default) };
});

describe("AccountBalanceSummaryFooter", () => {
  describe("Testing disableDelegation in currency config", () => {
    const DELEGATE_BALANCE = BigNumber(1);
    const DELEGATE_BALANCE_TEXT = "balance for test: " + DELEGATE_BALANCE;

    const DELEGATE_UNBONDING_BALANCE = BigNumber(2);
    const DELEGATE_UNBONDING_BALANCE_TEXT =
      "unbounding balance for test: " + DELEGATE_UNBONDING_BALANCE;

    const ACCOUNT = {
      type: "Account",
      stakingResources: {
        delegatedBalance: DELEGATE_BALANCE,
        unbondingBalance: DELEGATE_UNBONDING_BALANCE,
      },
      currency: {
        id: "babylon",
      } as unknown as CryptoCurrency,
    } as CosmosAccount;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should display delegated balance and unbound balance when disableDelegation flag is false and unbound balance is greater than 0", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      mockFormatCurrencyUnit(
        ACCOUNT.stakingResources.delegatedBalance,
        ACCOUNT.stakingResources.unbondingBalance,
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
        ACCOUNT.stakingResources.delegatedBalance,
        ACCOUNT.stakingResources.unbondingBalance,
      );

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);

      expect(cryptoFactory).toHaveBeenCalledWith("babylon");
    });

    it.each([BigNumber(0), BigNumber(-1)])(
      "should display delegated balance and not display unbound balance when disableDelegation flag is false and unbound balance is less or equal to 0 (here %s)",
      unboundBalance => {
        mockGetCurrencyConfiguration({ disableDelegation: false });

        const account = {
          ...ACCOUNT,
        } as CosmosAccount;
        account.stakingResources.unbondingBalance = unboundBalance;

        mockFormatCurrencyUnit(
          account.stakingResources.delegatedBalance,
          account.stakingResources.unbondingBalance,
        );

        render(<AccountBalanceSummaryFooter account={account} />);
        expect(screen.getByText("Delegated assets")).toBeInTheDocument();
        expect(screen.getByText(DELEGATE_BALANCE_TEXT)).toBeInTheDocument();
        expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
        expect(screen.queryByText(DELEGATE_UNBONDING_BALANCE_TEXT)).not.toBeInTheDocument();
      },
    );

    it("should not display delegated balance and unbound balance when disableDelegation flag is true", () => {
      mockGetCurrencyConfiguration({ disableDelegation: true });
      mockFormatCurrencyUnit(
        ACCOUNT.stakingResources.delegatedBalance,
        ACCOUNT.stakingResources.unbondingBalance,
      );

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.queryByText("Delegated assets")).not.toBeInTheDocument();
      expect(screen.queryByText(DELEGATE_BALANCE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
      expect(screen.queryByText(DELEGATE_UNBONDING_BALANCE_TEXT)).not.toBeInTheDocument();
    });

    it("should render without throwing when there are no staking resources yet", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      mockFormatCurrencyUnit(BigNumber(0), BigNumber(0));

      const account = {
        type: "Account",
        stakingResources: {
          delegatedBalance: BigNumber(0),
          unbondingBalance: BigNumber(0),
        },
        currency: {
          id: "babylon",
        } as unknown as CryptoCurrency,
      } as CosmosAccount;

      expect(() => render(<AccountBalanceSummaryFooter account={account} />)).not.toThrow();
      // no delegated resources → the undelegating section must not be shown
      expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
    });

    it("should render the undelegating tooltip without throwing for a testnet id that aliases to a mainnet chain (crypto_org_croeseid)", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });

      const account = {
        type: "Account",
        stakingResources: {
          delegatedBalance: DELEGATE_BALANCE,
          unbondingBalance: DELEGATE_UNBONDING_BALANCE,
        },
        currency: {
          id: "crypto_org_croeseid",
        } as unknown as CryptoCurrency,
      } as CosmosAccount;

      mockFormatCurrencyUnit(
        account.stakingResources.delegatedBalance,
        account.stakingResources.unbondingBalance,
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
