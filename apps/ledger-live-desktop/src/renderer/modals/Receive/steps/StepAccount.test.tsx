import React from "react";
import { render, screen } from "tests/testSetup";
import StepAccount, { StepAccountFooter } from "./StepAccount";
import { StepProps } from "../Body";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

jest.mock("~/renderer/families", () => ({
  getLLDCoinFamily: jest.fn(),
}));

const mockCurrency = getCryptoCurrencyById("bitcoin");

const mockAccount: Account = {
  id: "account-1",
  type: "Account",
  currency: mockCurrency,
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
  blockHeight: 1,
  lastSyncDate: new Date(),
  swapHistory: [],
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  index: 0,
  used: false,
  freshAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  freshAddressPath: "44'/0'/0'/0/0",
  seedIdentifier: "seed",
  derivationMode: "" as const,
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 0 },
    DAY: { balances: [], latestDate: 0 },
    WEEK: { balances: [], latestDate: 0 },
  },
  creationDate: new Date(),
};

const baseProps: StepProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: jest.fn((key: string) => key) as any,
  transitionTo: jest.fn(),
  device: null,
  account: mockAccount,
  parentAccount: null,
  closeModal: jest.fn(),
  isAddressVerified: null,
  verifyAddressError: null,
  onRetry: jest.fn(),
  onSkipConfirm: jest.fn(),
  onResetSkip: jest.fn(),
  onChangeAccount: jest.fn(),
  onChangeAddressVerified: jest.fn(),
  onClose: jest.fn(),
  currencyName: "Bitcoin",
  accountError: undefined,
};

describe("StepAccount", () => {
  it("should render account selection", () => {
    const { container } = render(<StepAccount {...baseProps} />);
    // Check that SelectAccount component is rendered
    expect(container.querySelector(".select__control")).toBeInTheDocument();
  });

  it("should show error banner when accountError is present", () => {
    const error = new Error("Test error");
    render(<StepAccount {...baseProps} accountError={error} />);
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });
});

describe("StepAccountFooter", () => {
  it("should render continue button", () => {
    render(<StepAccountFooter {...baseProps} />);
    const button = screen.getByTestId("modal-continue-button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("should disable button when no account", () => {
    render(<StepAccountFooter {...baseProps} account={null} />);
    const button = screen.getByTestId("modal-continue-button");
    expect(button).toBeDisabled();
  });

  it("should disable button when accountError is present", () => {
    render(<StepAccountFooter {...baseProps} accountError={new Error("Test")} />);
    const button = screen.getByTestId("modal-continue-button");
    expect(button).toBeDisabled();
  });

  it("should call transitionTo on button click", () => {
    const transitionTo = jest.fn();
    render(<StepAccountFooter {...baseProps} transitionTo={transitionTo} />);
    const button = screen.getByTestId("modal-continue-button");
    button.click();
    expect(transitionTo).toHaveBeenCalledWith("device");
  });
});
