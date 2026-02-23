import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import * as currencies from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import { PRIVATE_BALANCE_PLACEHOLDER } from "./constants";
import { ALEO_ACCOUNT_1 } from "./__mocks__/account.mock";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/currencies/index");

const mockUseAccountUnit = jest.mocked(useAccountUnit);

describe("AccountBalanceSummaryFooter", () => {
  const mockSpendableBalance = BigNumber(100);
  const mockTransparentBalance = BigNumber(60);
  const mockAccount: AleoAccount = {
    ...ALEO_ACCOUNT_1,
    spendableBalance: mockSpendableBalance,
    aleoResources: {
      transparentBalance: mockTransparentBalance,
      provableApi: null,
      privateBalance: null,
      unspentPrivateRecords: [],
      lastPrivateSyncDate: new Date(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAccountUnit.mockReturnValue({
      code: "ALEO",
      name: "Aleo",
      magnitude: 6,
    });

    jest
      .spyOn(currencies, "formatCurrencyUnit")
      .mockImplementation((_unit, value, _formatConfig) => {
        return value ? `formatted: ${value.toString()}` : PRIVATE_BALANCE_PLACEHOLDER;
      });
  });

  it("should display available balance and transparent balance", () => {
    render(<AccountBalanceSummaryFooter account={mockAccount} />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText(`formatted: ${mockSpendableBalance}`)).toBeInTheDocument();

    expect(screen.getByText("Transparent balance")).toBeInTheDocument();
    expect(screen.getByText(`formatted: ${mockTransparentBalance}`)).toBeInTheDocument();
  });

  it("should display *** for private balance when privateBalance is null", () => {
    const mockAccountWithoutPrivateBalance = {
      ...mockAccount,
      aleoResources: {
        ...mockAccount.aleoResources,
      },
    } as AleoAccount;

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

  it("should return null when aleoResources is missing", () => {
    const mockAccountWithoutResources = {
      ...mockAccount,
      aleoResources: undefined,
    } as unknown as AleoAccount;

    const { container } = render(
      <AccountBalanceSummaryFooter account={mockAccountWithoutResources} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
