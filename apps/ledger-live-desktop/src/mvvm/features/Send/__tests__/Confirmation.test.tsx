import React from "react";
import { render, screen } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { SEND_FLOW_STEP } from "../types";
import {
  FlowWizardOrchestrator,
  createStepRegistry,
} from "../../FlowWizard/FlowWizardOrchestrator";
import { SendFlowProvider } from "../context/SendFlowContext";
import { ConfirmationScreen } from "../screens/Confirmation/ConfirmationScreen";
import { createBusinessContext, TestFlowLayout } from "./shared";

// Mock react-i18next to return translation keys for stable assertions
jest.mock("react-i18next", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = jest.requireActual("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

describe("Send flow - Confirmation step (integration)", () => {
  const flowConfig = {
    stepOrder: [SEND_FLOW_STEP.SIGNATURE, SEND_FLOW_STEP.CONFIRMATION] as const,
    stepConfigs: {
      [SEND_FLOW_STEP.SIGNATURE]: { id: SEND_FLOW_STEP.SIGNATURE, canGoBack: false },
      [SEND_FLOW_STEP.CONFIRMATION]: { id: SEND_FLOW_STEP.CONFIRMATION, canGoBack: false },
    },
    initialStep: SEND_FLOW_STEP.CONFIRMATION,
  };

  const stepRegistry = createStepRegistry({
    [SEND_FLOW_STEP.SIGNATURE]: () => <div data-testid="signature-step" />,
    [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
  });

  describe("User refused state (idle)", () => {
    it("should display user refused message and allow retry", async () => {
      const businessContext = createBusinessContext();

      const { user } = render(
        <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
          <SendFlowProvider value={businessContext}>
            <TestFlowLayout />
          </SendFlowProvider>
        </FlowWizardOrchestrator>,
      );

      // "idle" maps to UserRefused informational state in the UI.
      expect(screen.getByText("errors.UserRefusedOnDevice.title")).toBeVisible();
      expect(screen.getByText("errors.UserRefusedOnDevice.description")).toBeVisible();

      await user.click(screen.getByRole("button", { name: "common.tryAgain" }));

      expect(businessContext.operation.onRetry).toHaveBeenCalledTimes(1);
      expect(businessContext.status.resetStatus).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("signature-step")).toBeVisible();
    });

    it("should allow closing the flow", async () => {
      const businessContext = createBusinessContext();

      const { user } = render(
        <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
          <SendFlowProvider value={businessContext}>
            <TestFlowLayout />
          </SendFlowProvider>
        </FlowWizardOrchestrator>,
      );

      await user.click(screen.getByRole("button", { name: "common.close" }));

      expect(businessContext.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("Success state", () => {
    it("should display success message with view details and close buttons", async () => {
      const mockOperation: Operation = {
        id: "operation-id",
        hash: "tx-hash",
        type: "OUT",
        value: new BigNumber(1000000),
        fee: new BigNumber(1000),
        blockHeight: null,
        blockHash: null,
        accountId: "account-id",
        senders: ["sender"],
        recipients: ["recipient"],
        date: new Date(),
        extra: {},
      };

      const businessContext = createBusinessContext({
        operation: {
          optimisticOperation: mockOperation,
          transactionError: null,
          signed: true,
        },
      });

      const { user } = render(
        <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
          <SendFlowProvider value={businessContext}>
            <TestFlowLayout />
          </SendFlowProvider>
        </FlowWizardOrchestrator>,
      );

      expect(screen.getByText("send.steps.confirmation.success.title")).toBeVisible();
      expect(screen.getByText("send.steps.confirmation.success.text")).toBeVisible();

      // Should have view details button
      expect(
        screen.getByRole("button", { name: "send.steps.confirmation.success.cta" }),
      ).toBeVisible();

      // Should have close button
      const closeButton = screen.getByRole("button", { name: "common.close" });
      expect(closeButton).toBeVisible();

      await user.click(closeButton);
      expect(businessContext.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error state", () => {
    it("should display error message with retry button", async () => {
      const mockError = new Error("Transaction broadcast failed");

      const businessContext = createBusinessContext({
        operation: {
          optimisticOperation: null,
          transactionError: mockError,
          signed: true,
        },
      });

      const { user } = render(
        <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
          <SendFlowProvider value={businessContext}>
            <TestFlowLayout />
          </SendFlowProvider>
        </FlowWizardOrchestrator>,
      );

      // Should show export logs button
      expect(screen.getByText("settings.exportLogs.title")).toBeVisible();

      // Should have retry button
      const retryButton = screen.getByRole("button", { name: "common.tryAgain" });
      expect(retryButton).toBeVisible();

      await user.click(retryButton);

      expect(businessContext.operation.onRetry).toHaveBeenCalledTimes(1);
      expect(businessContext.status.resetStatus).toHaveBeenCalledTimes(1);
    });

    it("should allow closing on error", async () => {
      const mockError = new Error("Transaction failed");

      const businessContext = createBusinessContext({
        operation: {
          optimisticOperation: null,
          transactionError: mockError,
          signed: true,
        },
      });

      const { user } = render(
        <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
          <SendFlowProvider value={businessContext}>
            <TestFlowLayout />
          </SendFlowProvider>
        </FlowWizardOrchestrator>,
      );

      const closeButton = screen.getByRole("button", { name: "common.close" });
      await user.click(closeButton);

      expect(businessContext.close).toHaveBeenCalledTimes(1);
    });
  });
});
