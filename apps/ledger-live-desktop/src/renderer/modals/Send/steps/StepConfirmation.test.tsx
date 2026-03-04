import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import StepConfirmation, { StepConfirmationFooter } from "./StepConfirmation";
import BigNumber from "bignumber.js";
import { TFunction } from "i18next";
import { AccountLike } from "@ledgerhq/types-live";

jest.mock("./Confirmation/NodeError", () => ({
  __esModule: true,
  default: () => <div data-testid="node-error" />,
}));

jest.mock("~/renderer/components/ErrorDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="error-display" />,
}));

const mockT: TFunction = jest.fn((k: string) => k) as unknown as TFunction;

const mockAccount = {
  type: "Account",
  id: "mock-account-id",
  currency: {
    ticker: "ETH",
    name: "Ethereum",
    family: "evm",
  },
} as unknown as AccountLike;

const baseProps = {
  t: mockT,
  transitionTo: jest.fn(),
  onRetry: jest.fn(),
  closeModal: jest.fn(),
  account: null,
  parentAccount: null,
  optimisticOperation: null,
  openedFromAccount: false,
  device: null,
  transaction: null,
  status: {
    errors: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    warnings: {},
  },
  bridgePending: false,
  error: null,
  setTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  resetTransaction: jest.fn(),
  onChangeAccount: jest.fn(),
  onChangeTransaction: jest.fn(),
  onChangeStatus: jest.fn(),
  onChangeBridgePending: jest.fn(),
  onChangeDevice: jest.fn(),
  onChangeOpenedFromAccount: jest.fn(),
  openModal: jest.fn(),
  onTransactionError: jest.fn(),
  onOperationBroadcasted: jest.fn(),
  setSigned: jest.fn(),
  onClose: jest.fn(),
  onBack: jest.fn(),
  onStepChange: jest.fn(),
  onError: jest.fn(),
  onSuccess: jest.fn(),
  signed: false,
  onResetMaybeRecipient: jest.fn(),
  onResetMaybeAmount: jest.fn(),
  onConfirmationHandler: jest.fn(),
  onBroadcast: jest.fn(),
  onFailHandler: jest.fn(),
  currencyName: "Bitcoin",
};

describe("StepConfirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      caseName: "is InvalidTransactionError",
      error: Object.assign(new Error("InvalidTransactionError"), {
        name: "InvalidTransactionError",
      }),
    },
    {
      caseName: "wraps InvalidTransactionError in cause",
      error: Object.assign(new Error("broadcast failed"), {
        cause: Object.assign(new Error("root cause"), { name: "InvalidTransactionError" }),
      }),
    },
  ])(
    "renders ErrorDisplay instead of NodeError when signed=true and error $caseName",
    ({ error }) => {
      render(<StepConfirmation {...baseProps} signed error={error} account={mockAccount} />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.queryByTestId("node-error")).not.toBeInTheDocument();
    },
  );
});

describe("StepConfirmationFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders RetryButton when error is 5xx (LedgerAPI5xx)", () => {
    render(<StepConfirmationFooter {...baseProps} error={{ name: "LedgerAPI5xx" } as Error} />);

    expect(screen.getByRole("button")).toHaveTextContent("Retry");
  });

  it("renders RetryButton when error is NetworkDown", () => {
    render(<StepConfirmationFooter {...baseProps} error={{ name: "NetworkDown" } as Error} />);

    expect(screen.getByRole("button")).toHaveTextContent("Retry");
  });

  it("renders RetryButton when error is DeviceLockedError", () => {
    render(
      <StepConfirmationFooter {...baseProps} error={{ name: "DeviceLockedError" } as Error} />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Retry");
  });

  it("renders RetryButton when error is LockedDeviceError", () => {
    render(
      <StepConfirmationFooter {...baseProps} error={{ name: "LockedDeviceError" } as Error} />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Retry");
  });

  it("renders RetryButton when error is UserRefusedOnDevice", () => {
    render(
      <StepConfirmationFooter {...baseProps} error={{ name: "UserRefusedOnDevice" } as Error} />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Retry");
  });

  it("renders AbortButton when error is not 5xx", () => {
    render(<StepConfirmationFooter {...baseProps} error={{ name: "LedgerAPI4xx" } as Error} />);

    expect(screen.getByRole("button")).toHaveTextContent("Close");
  });

  it("clicking AbortButton triggers closeModal()", () => {
    render(<StepConfirmationFooter {...baseProps} error={{ name: "SomeOtherError" } as Error} />);

    fireEvent.click(screen.getByRole("button"));
    expect(baseProps.closeModal).toHaveBeenCalled();
  });

  it("clicking RetryButton triggers onRetry() and transitionTo('summary')", () => {
    render(<StepConfirmationFooter {...baseProps} error={{ name: "LedgerAPI5xx" } as Error} />);

    fireEvent.click(screen.getByRole("button"));

    expect(baseProps.onRetry).toHaveBeenCalled();
    expect(baseProps.transitionTo).toHaveBeenCalledWith("summary");
  });

  it("renders success CTA when optimisticOperation exists", () => {
    render(
      <StepConfirmationFooter
        {...baseProps}
        error={null}
        optimisticOperation={{
          id: "123",
          accountId: "acc",
          subOperations: [],
          hash: "mockHash",
          type: "OUT",
          value: new BigNumber(0),
          fee: new BigNumber(0),
          senders: ["mockSender"],
          recipients: ["mockRecipient"],
          blockHeight: 0,
          blockHash: null,
          date: new Date(),
          extra: {},
        }}
      />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("send.steps.confirmation.success.cta");
  });

  it("renders nothing when no error and no optimisticOperation", () => {
    const { container } = render(<StepConfirmationFooter {...baseProps} />);

    expect(container).toBeEmptyDOMElement();
  });
});
