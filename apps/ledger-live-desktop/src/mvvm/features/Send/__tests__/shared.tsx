import React from "react";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowBusinessContext,
  SendFlowOperationActions,
  SendFlowState,
  SendFlowStep,
} from "../types";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";

/**
 * Shared test layout component that renders the current step
 * from FlowWizard context
 */
export function TestFlowLayout() {
  const { currentStepRenderer: Step } = useFlowWizard<SendFlowStep>();
  return Step ? <Step /> : null;
}

/**
 * Creates a mock business context for Send flow tests
 * @param overrides - Partial state to override default values
 * @returns Mocked SendFlowBusinessContext
 */
export function createBusinessContext(
  overrides: Partial<SendFlowState> = {},
): SendFlowBusinessContext {
  const operation: SendFlowOperationActions = {
    onOperationBroadcasted: jest.fn(),
    onTransactionError: jest.fn(),
    onSigned: jest.fn(),
    onRetry: jest.fn(),
  };

  const state: SendFlowState = {
    account: {
      account: null,
      parentAccount: null,
      currency: null,
    },
    transaction: {
      transaction: null,
      status: {} as TransactionStatus,
      bridgeError: null,
      bridgePending: false,
    },
    recipient: null,
    operation: {
      optimisticOperation: null,
      transactionError: null,
      signed: false,
    },
    isLoading: false,
    flowStatus: "idle",
    ...overrides,
  };

  return {
    state,
    uiConfig: {
      hasMemo: false,
      recipientSupportsDomain: false,
      hasFeePresets: false,
      hasCustomFees: false,
      hasCoinControl: false,
    },
    recipientSearch: {
      value: "",
      setValue: jest.fn(),
      clear: jest.fn(),
    },
    transaction: {
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      setRecipient: jest.fn(),
      setAccount: jest.fn(),
    },
    operation,
    status: {
      setStatus: jest.fn(),
      setError: jest.fn(),
      setSuccess: jest.fn(),
      resetStatus: jest.fn(),
    },
    close: jest.fn(),
    setAccountAndNavigate: jest.fn(),
  };
}
