import React from "react";
import { render, screen } from "tests/testSetup";
import { formatAddress } from "@ledgerhq/react-ui/pre-ldls/components/Address/formatAddress";
import { SendFlowProvider } from "../../context/SendFlowContext";
import { SendHeader } from "../SendHeader";
import { SEND_FLOW_STEP } from "../../types";

jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useSelector: jest.fn(() => null),
  };
});

jest.mock("@ledgerhq/live-countervalues-react", () => {
  const actual = jest.requireActual("@ledgerhq/live-countervalues-react");
  return {
    ...actual,
    useCalculate: jest.fn(() => undefined),
  };
});

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: jest.fn(() => undefined),
}));

function renderWithContext(contextValue: unknown) {
  return render(
    // eslint-disable-next-line
    <SendFlowProvider value={contextValue as never}>
      <SendHeader />
    </SendFlowProvider>,
  );
}

describe("SendHeader (recipient input)", () => {
  it("shows formatted ENS in Amount step and clicking pre-fills search with ENS name then navigates back", async () => {
    const recipientAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const ensName = "vitalik.eth";
    const formatted = formatAddress(recipientAddress, { prefixLength: 5, suffixLength: 5 });
    const displayValue = `${ensName} (${formatted})`;

    const setValue = jest.fn();
    const goToPreviousStep = jest.fn();
    const updateTransaction = jest.fn();

    const contextValue = {
      navigation: {
        canGoBack: () => true,
        goToPreviousStep,
      },
      currentStep: SEND_FLOW_STEP.AMOUNT,
      direction: "forward",
      currentStepConfig: { id: SEND_FLOW_STEP.AMOUNT, canGoBack: true, addressInput: true },
      state: {
        account: { account: null, parentAccount: null, currency: null },
        transaction: { transaction: null, status: {}, bridgeError: null, bridgePending: false },
        recipient: { address: recipientAddress, ensName },
        operation: { optimisticOperation: null, transactionError: null, signed: false },
        isLoading: false,
        flowStatus: "idle",
      },
      uiConfig: {
        hasMemo: false,
        recipientSupportsDomain: true,
        hasFeePresets: false,
        hasCustomFees: false,
        hasCoinControl: false,
      },
      recipientSearch: { value: "", setValue, clear: jest.fn() },
      transaction: {
        setTransaction: jest.fn(),
        updateTransaction,
        setRecipient: jest.fn(),
        setAccount: jest.fn(),
      },
      operation: {
        onOperationBroadcasted: jest.fn(),
        onTransactionError: jest.fn(),
        onSigned: jest.fn(),
        onRetry: jest.fn(),
      },
      status: {
        setLoading: jest.fn(),
        setError: jest.fn(),
        setSuccess: jest.fn(),
        reset: jest.fn(),
      },
      close: jest.fn(),
      setAccountAndNavigate: jest.fn(),
    };

    const { user } = renderWithContext(contextValue);

    expect(screen.getByDisplayValue(displayValue)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Edit recipient" }));

    expect(setValue).toHaveBeenCalledWith(ensName);
    expect(updateTransaction).toHaveBeenCalled();
    expect(goToPreviousStep).toHaveBeenCalled();
  });

  it("shows formatted address in Amount step and clicking pre-fills search with full address", async () => {
    const recipientAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const formatted = formatAddress(recipientAddress, { prefixLength: 5, suffixLength: 5 });

    const setValue = jest.fn();
    const goToPreviousStep = jest.fn();

    const contextValue = {
      navigation: {
        canGoBack: () => true,
        goToPreviousStep,
      },
      currentStep: SEND_FLOW_STEP.AMOUNT,
      direction: "forward",
      currentStepConfig: { id: SEND_FLOW_STEP.AMOUNT, canGoBack: true, addressInput: true },
      state: {
        account: { account: null, parentAccount: null, currency: null },
        transaction: { transaction: null, status: {}, bridgeError: null, bridgePending: false },
        recipient: { address: recipientAddress },
        operation: { optimisticOperation: null, transactionError: null, signed: false },
        isLoading: false,
        flowStatus: "idle",
      },
      uiConfig: {
        hasMemo: false,
        recipientSupportsDomain: true,
        hasFeePresets: false,
        hasCustomFees: false,
        hasCoinControl: false,
      },
      recipientSearch: { value: "", setValue, clear: jest.fn() },
      transaction: {
        setTransaction: jest.fn(),
        updateTransaction: jest.fn(),
        setRecipient: jest.fn(),
        setAccount: jest.fn(),
      },
      operation: {
        onOperationBroadcasted: jest.fn(),
        onTransactionError: jest.fn(),
        onSigned: jest.fn(),
        onRetry: jest.fn(),
      },
      status: {
        setLoading: jest.fn(),
        setError: jest.fn(),
        setSuccess: jest.fn(),
        reset: jest.fn(),
      },
      close: jest.fn(),
      setAccountAndNavigate: jest.fn(),
    };

    const { user } = renderWithContext(contextValue);

    expect(screen.getByDisplayValue(formatted)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Edit recipient" }));

    expect(setValue).toHaveBeenCalledWith(recipientAddress);
    expect(goToPreviousStep).toHaveBeenCalled();
  });
});
