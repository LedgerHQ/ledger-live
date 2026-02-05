import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import * as currencies from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { ALEO_ACCOUNT_1 } from "../__mocks__/accounts.mock";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/currencies/index");

describe("AccountBalanceSummaryFooter", () => {
  const mockSpendableBalance = BigNumber(100);
  const mockTransparentBalance = BigNumber(60);
  const mockPrivateBalance = BigNumber(40);

  const mockAccount: AleoAccount = {
    ...ALEO_ACCOUNT_1,
    spendableBalance: mockSpendableBalance,
    aleoResources: {
      transparentBalance: mockTransparentBalance,
      privateBalance: mockPrivateBalance,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .spyOn(currencies, "formatCurrencyUnit")
      .mockImplementation((_unit, value, _formatConfig) => {
        return value ? `formatted: ${value.toString()}` : "***";
      });
  });

  it("should display available balance, transparent balance, and private balance", () => {
    render(<AccountBalanceSummaryFooter account={mockAccount} />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText(`formatted: ${mockSpendableBalance}`)).toBeInTheDocument();

    expect(screen.getByText("Transparent balance")).toBeInTheDocument();
    expect(screen.getByText(`formatted: ${mockTransparentBalance}`)).toBeInTheDocument();

    expect(screen.getByText("Private balance")).toBeInTheDocument();
    expect(screen.getByText(`formatted: ${mockPrivateBalance}`)).toBeInTheDocument();
  });

  it("should display *** for private balance when privateBalance is null", () => {
    const mockAccountWithoutPrivateBalance = {
      ...mockAccount,
      aleoResources: {
        ...mockAccount.aleoResources,
        privateBalance: null,
      },
    };

    render(<AccountBalanceSummaryFooter account={mockAccountWithoutPrivateBalance} />);

    expect(screen.getByText("***")).toBeInTheDocument();
  });

  it("should return null when account type is not Account", () => {
    const mockTokenAccount = {
      ...mockAccount,
      type: "TokenAccount",
    } as unknown as TokenAccount;

    const { container } = render(<AccountBalanceSummaryFooter account={mockTokenAccount} />);

    expect(container).toBeEmptyDOMElement();
  });
});
