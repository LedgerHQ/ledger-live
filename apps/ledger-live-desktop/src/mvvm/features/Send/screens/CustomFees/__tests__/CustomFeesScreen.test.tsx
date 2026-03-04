/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { CustomFeesScreen } from "../CustomFeesScreen";
import * as UseCustomFeesViewModel from "../hooks/useCustomFeesViewModel";

// Minimal stubs — shape is enough, logic is delegated to the mocked ViewModel
const mockNavigation = { goToStep: jest.fn() };
const mockTransactionActions = { updateTransaction: jest.fn() };
const mockAccount = { id: "acc_bitcoin", type: "Account" };
const mockTransaction = { family: "bitcoin", amount: {} };
const mockStatus = { errors: {}, estimatedFees: {} };

jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(() => ({ navigation: mockNavigation })),
}));

jest.mock("../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({
    state: {
      account: { account: mockAccount, parentAccount: null },
      transaction: { transaction: mockTransaction, status: mockStatus },
    },
  })),
  useSendFlowActions: jest.fn(() => ({ transaction: mockTransactionActions })),
}));

jest.mock("../hooks/useStableGasOptions", () => ({
  useStableGasOptions: jest.fn(tx => tx),
}));

jest.mock("@ledgerhq/coin-framework/account/helpers", () => ({
  ...jest.requireActual("@ledgerhq/coin-framework/account/helpers"),
  getMainAccount: jest.fn(() => mockAccount),
  getAccountCurrency: jest.fn(() => ({ id: "bitcoin", ticker: "BTC", units: [] })),
}));

jest.mock("../hooks/useCustomFeesViewModel", () => ({
  useCustomFeesViewModel: jest.fn(),
}));

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-react");
  return {
    ...actual,
    DialogBody: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    DialogFooter: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  };
});

function buildMockViewModel(
  overrides?: Partial<UseCustomFeesViewModel.CustomFeesViewModel>,
): UseCustomFeesViewModel.CustomFeesViewModel {
  return {
    inputs: [],
    fiatLabel: null,
    fiatValue: null,
    isConfirmDisabled: false,
    onInputChange: jest.fn(),
    onInputClear: jest.fn(),
    onConfirm: jest.fn(),
    hasCustomAssets: false,
    assetOptions: [],
    selectedAssetId: "",
    onAssetChange: jest.fn(),
    confirmLabel: "Confirm",
    suggestedLabel: "Suggested",
    payFeesInLabel: "Pay fees in",
    ...overrides,
  };
}

describe("CustomFeesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel")
      .mockImplementation(() => buildMockViewModel());
  });

  it("should render nothing when account is missing", () => {
    const { useSendFlowData } = jest.requireMock("../../../context/SendFlowContext");
    useSendFlowData.mockReturnValueOnce({
      state: {
        account: { account: null, parentAccount: null },
        transaction: { transaction: mockTransaction, status: mockStatus },
      },
    });
    const { container } = render(<CustomFeesScreen />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render nothing when transaction is missing", () => {
    const { useSendFlowData } = jest.requireMock("../../../context/SendFlowContext");
    useSendFlowData.mockReturnValueOnce({
      state: {
        account: { account: mockAccount, parentAccount: null },
        transaction: { transaction: null, status: mockStatus },
      },
    });
    const { container } = render(<CustomFeesScreen />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render the confirm button with the label from the ViewModel", () => {
    render(<CustomFeesScreen />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("should disable the confirm button when isConfirmDisabled is true", () => {
    jest
      .spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel")
      .mockImplementation(() => buildMockViewModel({ isConfirmDisabled: true }));
    render(<CustomFeesScreen />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("should call onConfirm when the confirm button is clicked", async () => {
    const onConfirm = jest.fn();
    jest
      .spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel")
      .mockImplementation(() => buildMockViewModel({ onConfirm }));
    const { user } = render(<CustomFeesScreen />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should render fee inputs from the ViewModel", () => {
    jest.spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel").mockImplementation(() =>
      buildMockViewModel({
        inputs: [
          {
            key: "gasPrice",
            label: "Fees amount (Gwei)",
            value: "10",
            error: null,
            suggestedRange: null,
            helperLabel: null,
            helperValue: null,
          },
        ],
      }),
    );
    render(<CustomFeesScreen />);
    expect(screen.getByText("Fees amount (Gwei)")).toBeInTheDocument();
  });

  it("should show input error message when an input has an error", () => {
    jest.spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel").mockImplementation(() =>
      buildMockViewModel({
        inputs: [
          {
            key: "gasPrice",
            label: "Fees amount (Gwei)",
            value: "abc",
            error: "Enter a valid number",
            suggestedRange: null,
            helperLabel: null,
            helperValue: null,
          },
        ],
      }),
    );
    render(<CustomFeesScreen />);
    expect(screen.getByText("Enter a valid number")).toBeInTheDocument();
  });

  it("should render fee asset selector with payFeesInLabel when hasCustomAssets is true", () => {
    jest.spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel").mockImplementation(() =>
      buildMockViewModel({
        hasCustomAssets: true,
        assetOptions: [
          { id: "celo", ticker: "CELO", label: "CELO" },
          { id: "cusd", ticker: "cUSD", label: "cUSD" },
        ] as UseCustomFeesViewModel.CustomFeesViewModel["assetOptions"],
        selectedAssetId: "celo",
        payFeesInLabel: "Pay fees in",
      }),
    );
    render(<CustomFeesScreen />);
    expect(screen.getByTestId("send-fee-asset-select")).toBeInTheDocument();
    expect(screen.getByText("Pay fees in")).toBeInTheDocument();
  });

  it("should render the suggested range when provided in an input", () => {
    jest.spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel").mockImplementation(() =>
      buildMockViewModel({
        inputs: [
          {
            key: "gasPrice",
            label: "Fees amount (Gwei)",
            value: "10",
            error: null,
            suggestedRange: { min: "1", max: "20" },
            helperLabel: null,
            helperValue: null,
          },
        ],
        suggestedLabel: "Suggested",
      }),
    );
    render(<CustomFeesScreen />);
    expect(screen.getByText("Suggested")).toBeInTheDocument();
    expect(screen.getByText("1-20")).toBeInTheDocument();
  });

  it("should render fiat label and value when provided", () => {
    jest.spyOn(UseCustomFeesViewModel, "useCustomFeesViewModel").mockImplementation(() =>
      buildMockViewModel({
        fiatLabel: "Network fees in USD",
        fiatValue: "$0.50",
      }),
    );
    render(<CustomFeesScreen />);
    expect(screen.getByText("Network fees in USD")).toBeInTheDocument();
    expect(screen.getByText("$0.50")).toBeInTheDocument();
  });
});
