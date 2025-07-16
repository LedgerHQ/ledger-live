import React from "react";
import { render, screen } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import * as config from "@ledgerhq/live-common/config/index";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import * as currencies from "@ledgerhq/live-common/currencies/index";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/currencies/index");

describe("AccountBalanceSummaryFooter", () => {
  describe("Testing disableDelegation in currency config", () => {
    const DELEGATE_BALANCE = BigNumber(1);
    const DELEGATE_BALANCE_TEXT = "balance for test: " + DELEGATE_BALANCE;

    const DELEGATE_UNBONDING_BALANCE = BigNumber(2);
    const DELEGATE_UNBONDING_BALANCE_TEXT =
      "unbounding balance for test: " + DELEGATE_UNBONDING_BALANCE;

    const ACCOUNT = {
      type: "Account",
      cosmosResources: {
        delegatedBalance: DELEGATE_BALANCE,
        unbondingBalance: DELEGATE_UNBONDING_BALANCE,
      },
      currency: {
        id: "some random id",
      } as unknown as CryptoCurrency,
    } as CosmosAccount;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should display delegated balance and unbound balance when disableDelegation flag is false and unbound balance is greater than 0", () => {
      mockGetCurrencyConfiguration({ disableDelegation: false });
      mockFormatCurrencyUnit(
        ACCOUNT.cosmosResources.delegatedBalance,
        ACCOUNT.cosmosResources.unbondingBalance,
      );

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.getByText("Delegated assets")).toBeInTheDocument();
      expect(screen.getByText(DELEGATE_BALANCE_TEXT)).toBeInTheDocument();
      expect(screen.getByText("Undelegating")).toBeInTheDocument();
      expect(screen.getByText(DELEGATE_UNBONDING_BALANCE_TEXT)).toBeInTheDocument();
    });

    it.each([BigNumber(0), BigNumber(-1)])(
      "should display delegated balance and not display unbound balance when disableDelegation flag is false and unbound balance is less or equal to 0 (here %s)",
      unboundBalance => {
        mockGetCurrencyConfiguration({ disableDelegation: false });

        const account = {
          ...ACCOUNT,
        } as CosmosAccount;
        account.cosmosResources.unbondingBalance = unboundBalance;

        mockFormatCurrencyUnit(
          account.cosmosResources.delegatedBalance,
          account.cosmosResources.unbondingBalance,
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
        ACCOUNT.cosmosResources.delegatedBalance,
        ACCOUNT.cosmosResources.unbondingBalance,
      );

      render(<AccountBalanceSummaryFooter account={ACCOUNT} />);
      expect(screen.queryByText("Delegated assets")).not.toBeInTheDocument();
      expect(screen.queryByText(DELEGATE_BALANCE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
      expect(screen.queryByText(DELEGATE_UNBONDING_BALANCE_TEXT)).not.toBeInTheDocument();
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
