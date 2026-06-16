import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";
import type { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import type { StepProps } from "../types";

const updateTransactionMock = jest.fn((tx, patch) => ({ ...tx, ...patch }));

const bakersMock = jest.fn(() => [
  {
    address: "tz1baker-a",
    name: "Baker A",
    logoURL: "",
    nominalYield: "5 %",
    capacityStatus: "normal",
  },
  {
    address: "tz1baker-b",
    name: "Baker B",
    logoURL: "",
    nominalYield: "4 %",
    capacityStatus: "full",
  },
]);

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  useBakers: () => bakersMock(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => ({
    createTransaction: jest.fn(),
    updateTransaction: updateTransactionMock,
    getTransactionStatus: jest.fn(),
  }),
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/Modal/ModalContent", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("../../BakerImage", () => ({ __esModule: true, default: () => null }));

import StepValidator, { StepValidatorFooter } from "../steps/StepValidator";

const currency = getCryptoCurrencyById("tezos");

const makeAccount = (): TezosAccount =>
  ({
    ...genAccount("tezos-stepvalidator-test", { currency }),
  }) as unknown as TezosAccount;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => {
  const account = makeAccount();
  const transaction = {
    family: "tezos",
    mode: "delegate",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  } as unknown as Transaction;
  return {
    t: (key: string) => key,
    transitionTo: jest.fn(),
    device: null,
    account,
    parentAccount: null,
    transaction,
    status: {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    },
    bridgePending: false,
    error: null,
    optimisticOperation: null,
    signed: false,
    failedStep: null,
    onClose: jest.fn(),
    openModal: jest.fn(),
    onChangeTransaction: jest.fn(),
    onUpdateTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    ...overrides,
  } as unknown as StepProps;
};

describe("StakeFlowModal/StepValidator", () => {
  beforeEach(() => {
    updateTransactionMock.mockClear();
  });

  it("renders one row per baker", () => {
    const props = makeProps();
    act(() => {
      render(<StepValidator {...props} />);
    });
    expect(screen.getByText("Baker A")).toBeInTheDocument();
    expect(screen.getByText("Baker B")).toBeInTheDocument();
  });

  it("clicking a baker sets the recipient without advancing (the gate lives in the footer)", () => {
    const props = makeProps();
    act(() => {
      render(<StepValidator {...props} />);
    });

    act(() => {
      fireEvent.click(screen.getByText("Baker A"));
    });

    expect(updateTransactionMock).toHaveBeenCalledWith(props.transaction, {
      recipient: "tz1baker-a",
    });
    expect(props.onChangeTransaction).toHaveBeenCalledTimes(1);
    expect(props.transitionTo).not.toHaveBeenCalled();
  });

  it("does nothing when transaction is missing", () => {
    const props = makeProps({ transaction: null });
    act(() => {
      render(<StepValidator {...props} />);
    });

    act(() => {
      fireEvent.click(screen.getByText("Baker A"));
    });

    expect(updateTransactionMock).not.toHaveBeenCalled();
    expect(props.onChangeTransaction).not.toHaveBeenCalled();
    expect(props.transitionTo).not.toHaveBeenCalled();
  });
});

describe("StakeFlowModal/StepValidatorFooter", () => {
  const withRecipient = (overrides: Partial<StepProps> = {}) =>
    makeProps({
      transaction: {
        family: "tezos",
        mode: "delegate",
        amount: new BigNumber(0),
        fees: new BigNumber(0),
        recipient: "tz1baker-a",
        useAllAmount: false,
      } as unknown as Transaction,
      ...overrides,
    });

  it("disables Continue until a baker (recipient) is selected", () => {
    const props = makeProps(); // recipient is ""
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables Continue while the status is still being checked", () => {
    const props = withRecipient({ bridgePending: true });
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables Continue when the checked status has a blocking error", () => {
    const props = withRecipient({
      status: {
        errors: { amount: new NotEnoughBalance() },
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      } as unknown as StepProps["status"],
    });
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(props.transitionTo).not.toHaveBeenCalled();
  });

  it("disables Continue when the only blocking error is not an amount error", () => {
    const props = withRecipient({
      status: {
        errors: { recipient: new InvalidAddress() },
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      } as unknown as StepProps["status"],
    });
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(props.transitionTo).not.toHaveBeenCalled();
  });

  it("enables Continue and advances to device-delegation once the status is checked and clean", () => {
    const props = withRecipient();
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    act(() => {
      fireEvent.click(button);
    });
    expect(props.transitionTo).toHaveBeenCalledWith("device-delegation");
  });
});
