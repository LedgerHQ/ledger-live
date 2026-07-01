import React from "react";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { ConfirmationScreen } from "../index";
import * as UseConfirmationViewModelModule from "../hooks/useConfirmationViewModel";

type ConfirmationViewModel = ReturnType<
  typeof UseConfirmationViewModelModule.useConfirmationViewModel
>;

jest.mock("../hooks/useConfirmationViewModel", () => ({
  useConfirmationViewModel: jest.fn(),
}));

jest.mock("../../../context/SendFlowContext", () => {
  return {
    ...jest.requireActual("../../../context/SendFlowContext"),
    useSendFlowData: jest.fn().mockReturnValue({
      state: {
        account: {
          account: null,
          parentAccount: null,
        },
      },
    }),
  };
});

const onViewTransaction = jest.fn();
const onSaveLogs = jest.fn();
const onRetry = jest.fn();
const onClose = jest.fn();

function buildViewModel(overrides: Partial<ConfirmationViewModel> = {}): ConfirmationViewModel {
  return {
    status: FLOW_STATUS.SUCCESS,
    transactionError: null,
    canViewTransaction: true,
    onViewTransaction,
    onSaveLogs,
    onRetry,
    onClose,
    ...overrides,
  };
}

function mockViewModel(overrides: Partial<ConfirmationViewModel> = {}) {
  jest
    .mocked(UseConfirmationViewModelModule.useConfirmationViewModel)
    .mockReturnValue(buildViewModel(overrides));
}

describe("ConfirmationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the success title, description and both actions", () => {
    mockViewModel();
    render(<ConfirmationScreen />);

    expect(screen.getByText("Transaction signed")).toBeOnTheScreen();
    expect(screen.getByText("Your transaction is being processed")).toBeOnTheScreen();
    expect(screen.getByTestId("send-confirmation-success-gradient")).toBeOnTheScreen();
    expect(screen.getByTestId("send-confirmation-success-view-transaction")).toBeOnTheScreen();
    expect(screen.getByTestId("send-confirmation-success-close")).toBeOnTheScreen();
  });

  it("triggers onViewTransaction and onClose when the buttons are pressed", () => {
    mockViewModel();
    render(<ConfirmationScreen />);

    fireEvent.press(screen.getByTestId("send-confirmation-success-view-transaction"));
    expect(onViewTransaction).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId("send-confirmation-success-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides the view transaction button when there is no operation to show", () => {
    mockViewModel({ canViewTransaction: false });
    render(<ConfirmationScreen />);

    expect(screen.queryByTestId("send-confirmation-success-view-transaction")).toBeNull();
    expect(screen.getByTestId("send-confirmation-success-close")).toBeOnTheScreen();
  });

  it("renders the error state with save logs/retry/close when the flow status is ERROR", () => {
    mockViewModel({ status: FLOW_STATUS.ERROR, transactionError: new Error("broadcast failed") });
    render(<ConfirmationScreen />);

    expect(screen.queryByTestId("send-confirmation-success")).toBeNull();
    expect(screen.getByTestId("send-confirmation-error")).toBeOnTheScreen();
    expect(screen.getByTestId("send-confirmation-error-gradient")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("send-confirmation-error-save-logs"));
    expect(onSaveLogs).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId("send-confirmation-error-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId("send-confirmation-error-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("falls back to the success screen for a non-error status", () => {
    mockViewModel({ status: FLOW_STATUS.IDLE });
    render(<ConfirmationScreen />);

    expect(screen.queryByTestId("send-confirmation-error")).toBeNull();
    expect(screen.getByTestId("send-confirmation-success")).toBeOnTheScreen();
  });
});
