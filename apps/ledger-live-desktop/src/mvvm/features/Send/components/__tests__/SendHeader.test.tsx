/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { SendHeader } from "../SendHeader";
import { useSendHeaderModel } from "../../hooks/useSendHeaderModel";
import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../../context/SendFlowContext";

jest.mock("../../hooks/useSendHeaderModel");
jest.mock("../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(),
}));
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
  useSendFlowActions: jest.fn(),
}));
jest.mock("../../hooks/useAvailableBalance", () => ({
  useAvailableBalance: () => "",
}));
jest.mock("@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext", () => ({
  useSendAmountDisplayMode: () => ({
    displayMode: "fiat",
    setDisplayMode: jest.fn(),
  }),
}));
jest.mock("../AddressDisclaimer", () => ({ AddressDisclaimer: () => null }));
jest.mock("../../hooks/useSendHeaderMemo", () => ({
  useSendHeaderMemo: () => ({
    currencyId: undefined,
    hasMemoTypeOptions: false,
    memo: { value: "", type: undefined },
    memoTypeOptions: [],
    onMemoTypeChange: jest.fn(),
    showMemoValueInput: false,
    onMemoValueChange: jest.fn(),
    showSkipMemo: false,
    skipMemoState: "idle",
    onSkipMemoRequestConfirm: jest.fn(),
    onSkipMemoCancelConfirm: jest.fn(),
    onSkipMemoConfirm: jest.fn(),
    resetViewState: jest.fn(),
  }),
}));
jest.mock("@ledgerhq/lumen-ui-react", () => ({
  ...jest.requireActual("@ledgerhq/lumen-ui-react"),
  DialogHeader: ({ title }: { title?: string }) => <div>{title}</div>,
}));

const mockedUseSendHeaderModel = jest.mocked(useSendHeaderModel);

const baseModel = {
  addressInputValue: "0x123456...12345678",
  descriptionText: "Base 1 · $5,969.83",
  handleBack: jest.fn(),
  handleClose: jest.fn(),
  handleRecipientInputClick: jest.fn(),
  handleRecipientInputChange: jest.fn(),
  handleRecipientPaste: jest.fn(),
  handleQrCodeClick: jest.fn(),
  handleScanPicked: jest.fn(),
  isScannerOpen: false,
  recipientContact: undefined,
  recipientPlaceholder: "Enter address, ENS or contact",
  showBackButton: true,
  showRecipientInput: true,
  showMemoControls: false,
  title: "Send ETH",
  transactionErrorName: undefined,
  transactionError: undefined,
};

describe("SendHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFlowWizard as jest.Mock).mockReturnValue({
      currentStep: SEND_FLOW_STEP.AMOUNT,
      currentStepConfig: { addressInput: true },
      navigation: { goToNextStep: jest.fn() },
    });
    (useSendFlowData as jest.Mock).mockReturnValue({
      state: {
        account: { account: null, parentAccount: null, currency: null },
        recipient: null,
        transaction: { status: {} },
      },
      uiConfig: { hasMemo: false },
      recipientSearch: { value: "", setValue: jest.fn(), clear: jest.fn() },
    });
    (useSendFlowActions as jest.Mock).mockReturnValue({
      close: jest.fn(),
      transaction: { setRecipient: jest.fn(), updateTransaction: jest.fn() },
    });
  });

  it("shows the contact avatar and name when the recipient is a contact", () => {
    mockedUseSendHeaderModel.mockReturnValue({
      ...baseModel,
      addressInputValue: "Benoit Jean",
      recipientContact: { id: "contact-benoit", name: "Benoit Jean" },
    });

    render(<SendHeader />);

    expect(screen.getByTestId("send-recipient-contact-avatar")).toHaveTextContent("BJ");
    expect(screen.getByDisplayValue("Benoit Jean")).toBeVisible();
  });

  it("falls back to the address input when the recipient is not a contact", () => {
    mockedUseSendHeaderModel.mockReturnValue(baseModel);

    render(<SendHeader />);

    expect(screen.queryByTestId("send-recipient-contact-avatar")).toBeNull();
    expect(screen.getByDisplayValue("0x123456...12345678")).toBeVisible();
  });

  it.each([
    ["a contact", { id: "contact-benoit", name: "Benoit Jean" }],
    ["a plain address", undefined],
  ])("goes back to the recipient step when clicking the header showing %s", (_, contact) => {
    const handleRecipientInputClick = jest.fn();
    mockedUseSendHeaderModel.mockReturnValue({
      ...baseModel,
      recipientContact: contact,
      handleRecipientInputClick,
    });

    render(<SendHeader />);
    screen.getByTestId("send-edit-recipient-button").click();

    expect(handleRecipientInputClick).toHaveBeenCalled();
  });

  it("uses the placeholder computed by the header model on the recipient step", () => {
    (useFlowWizard as jest.Mock).mockReturnValue({
      currentStep: SEND_FLOW_STEP.RECIPIENT,
      currentStepConfig: { addressInput: true },
      navigation: { goToNextStep: jest.fn() },
    });
    mockedUseSendHeaderModel.mockReturnValue({
      ...baseModel,
      addressInputValue: "",
    });

    render(<SendHeader />);

    expect(screen.getByPlaceholderText("Enter address, ENS or contact")).toBeVisible();
  });

  it("keeps the recipient field read-only on the amount step", () => {
    mockedUseSendHeaderModel.mockReturnValue(baseModel);

    render(<SendHeader />);

    expect(screen.getByDisplayValue("0x123456...12345678")).toHaveAttribute("readonly");
  });
});
