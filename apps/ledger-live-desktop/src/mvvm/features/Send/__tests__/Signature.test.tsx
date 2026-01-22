import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { SEND_FLOW_STEP } from "../types";
import type { SendFlowState } from "../types";
import {
  FlowWizardOrchestrator,
  createStepRegistry,
} from "../../FlowWizard/FlowWizardOrchestrator";
import { SendFlowProvider } from "../context/SendFlowContext";
import { SignatureScreen } from "../screens/Signature/SignatureScreen";
import { createBusinessContext, TestFlowLayout } from "./shared";

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: ({ onResult }: { onResult: (result: { transactionSignError: Error }) => void }) => (
    <button
      type="button"
      data-testid="device-action-trigger-error"
      onClick={() => onResult({ transactionSignError: new Error("signature failed") })}
    >
      DeviceAction
    </button>
  ),
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  ...jest.requireActual("~/renderer/hooks/useConnectAppAction"),
  useTransactionAction: () => jest.fn(),
}));

jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => jest.fn(),
}));

describe("Send flow - Signature step (integration)", () => {
  const flowConfig = {
    stepOrder: [SEND_FLOW_STEP.SIGNATURE, SEND_FLOW_STEP.CONFIRMATION] as const,
    stepConfigs: {
      [SEND_FLOW_STEP.SIGNATURE]: { id: SEND_FLOW_STEP.SIGNATURE, canGoBack: false },
      [SEND_FLOW_STEP.CONFIRMATION]: { id: SEND_FLOW_STEP.CONFIRMATION, canGoBack: false },
    },
    initialStep: SEND_FLOW_STEP.SIGNATURE,
  };

  const stepRegistry = createStepRegistry({
    [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
    [SEND_FLOW_STEP.CONFIRMATION]: () => <div data-testid="confirmation-step" />,
  });

  it("should handle device signature error and navigate to next step", async () => {
    const businessContext = createBusinessContext({
      account: {
        account: {
          type: "Account",
          id: "mock_account_id",
        } as unknown as SendFlowState["account"]["account"],
        parentAccount: null,
        currency: null,
      },
      transaction: {
        transaction: {
          recipient: "recipient",
        } as unknown as Transaction,
        status: {} as TransactionStatus,
        bridgeError: null,
        bridgePending: false,
      },
    });

    render(
      <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
        <SendFlowProvider value={businessContext}>
          <TestFlowLayout />
        </SendFlowProvider>
      </FlowWizardOrchestrator>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("device-action-trigger-error")).toBeVisible();
    });

    screen.getByTestId("device-action-trigger-error").click();

    await waitFor(() => {
      expect(businessContext.operation.onTransactionError).toHaveBeenCalled();
      expect(businessContext.status.resetStatus).toHaveBeenCalled();
      expect(screen.getByTestId("confirmation-step")).toBeVisible();
    });
  });

  it("should not render when account or transaction is missing", () => {
    const businessContext = createBusinessContext({
      account: {
        account: null,
        parentAccount: null,
        currency: null,
      },
    });

    const { container } = render(
      <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
        <SendFlowProvider value={businessContext}>
          <TestFlowLayout />
        </SendFlowProvider>
      </FlowWizardOrchestrator>,
    );

    expect(container.querySelector('[data-testid="device-action-trigger-error"]')).toBeNull();
  });

  it("should call onTransactionError with the error from device", async () => {
    const businessContext = createBusinessContext({
      account: {
        account: {
          type: "Account",
          id: "mock_account_id",
        } as unknown as SendFlowState["account"]["account"],
        parentAccount: null,
        currency: null,
      },
      transaction: {
        transaction: {
          recipient: "recipient",
        } as unknown as Transaction,
        status: {} as TransactionStatus,
        bridgeError: null,
        bridgePending: false,
      },
    });

    render(
      <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
        <SendFlowProvider value={businessContext}>
          <TestFlowLayout />
        </SendFlowProvider>
      </FlowWizardOrchestrator>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("device-action-trigger-error")).toBeVisible();
    });

    screen.getByTestId("device-action-trigger-error").click();

    await waitFor(() => {
      expect(businessContext.operation.onTransactionError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "signature failed",
        }),
      );
    });
  });

  it("should call status.resetStatus when error occurs", async () => {
    const businessContext = createBusinessContext({
      account: {
        account: {
          type: "Account",
          id: "mock_account_id",
        } as unknown as SendFlowState["account"]["account"],
        parentAccount: null,
        currency: null,
      },
      transaction: {
        transaction: {
          recipient: "recipient",
        } as unknown as Transaction,
        status: {} as TransactionStatus,
        bridgeError: null,
        bridgePending: false,
      },
    });

    render(
      <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
        <SendFlowProvider value={businessContext}>
          <TestFlowLayout />
        </SendFlowProvider>
      </FlowWizardOrchestrator>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("device-action-trigger-error")).toBeVisible();
    });

    screen.getByTestId("device-action-trigger-error").click();

    await waitFor(() => {
      expect(businessContext.status.resetStatus).toHaveBeenCalledTimes(1);
    });
  });
});
