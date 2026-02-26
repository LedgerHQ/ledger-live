import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSendHeaderModel } from "../useSendHeaderModel";

jest.mock("../../../FlowWizard/FlowWizardContext", () => ({ useFlowWizard: jest.fn() }));
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
  useSendFlowActions: jest.fn(),
}));

import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../../context/SendFlowContext";

type VM = ReturnType<typeof useSendHeaderModel>;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let latestVM: VM | null = null;

function HookProbe({
  onResult,
  availableText = "",
  resetViewState = () => {},
}: {
  onResult: (vm: VM) => void;
  availableText?: string;
  resetViewState?: () => void;
}) {
  const vm = useSendHeaderModel({ availableText, resetViewState });
  onResult(vm);
  return null;
}

const mockNavigation = (overrides?: {
  canGoBack?: boolean;
  goToStep?: jest.Mock;
  goToPreviousStep?: jest.Mock;
}) => {
  const goToStep = overrides?.goToStep ?? jest.fn();
  const goToPreviousStep = overrides?.goToPreviousStep ?? jest.fn();
  const canGoBack = overrides?.canGoBack ?? true;
  (useFlowWizard as jest.Mock).mockReturnValue({
    currentStep: SEND_FLOW_STEP.AMOUNT,
    currentStepConfig: { addressInput: true, showTitle: true },
    navigation: {
      goToStep,
      goToPreviousStep,
      canGoBack: () => canGoBack,
    },
  });
  return { goToStep, goToPreviousStep };
};

const mockActions = (overrides?: { updateTransaction?: jest.Mock }) => {
  const close = jest.fn();
  const updateTransaction = overrides?.updateTransaction ?? jest.fn();
  (useSendFlowActions as jest.Mock).mockReturnValue({
    close,
    transaction: { updateTransaction },
  });
  return { close, updateTransaction };
};

const mockData = (
  state: unknown,
  uiConfig = { hasMemo: false },
  recipientSearch = { value: "" },
) => {
  (useSendFlowData as jest.Mock).mockReturnValue({
    state,
    uiConfig,
    recipientSearch: { ...recipientSearch, setValue: jest.fn(), clear: jest.fn() },
  });
};

function renderHook(availableText = "", resetViewState = () => {}) {
  act(() => {
    root.render(
      <HookProbe
        onResult={vm => (latestVM = vm)}
        availableText={availableText}
        resetViewState={resetViewState}
      />,
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  latestVM = null;
  mockData({
    account: { currency: { ticker: "ETH" } },
    recipient: null,
    transaction: { status: {} },
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("useSendHeaderModel", () => {
  describe("handleBack — backTarget (floating steps)", () => {
    it("calls goToStep(backTarget) when current step has backTarget and does not call goToPreviousStep or close", () => {
      const { goToStep, goToPreviousStep } = mockNavigation();
      const { close } = mockActions();
      const resetViewState = jest.fn();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.CUSTOM_FEES,
        currentStepConfig: { backTarget: SEND_FLOW_STEP.AMOUNT },
        navigation: { goToStep, goToPreviousStep, canGoBack: () => true },
      });

      renderHook("", resetViewState);
      latestVM?.handleBack();

      expect(goToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.AMOUNT);
      expect(goToPreviousStep).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it("runs COIN_CONTROL cleanup then navigates via backTarget when on COIN_CONTROL step", () => {
      const { goToStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.COIN_CONTROL,
        currentStepConfig: { backTarget: SEND_FLOW_STEP.AMOUNT },
        navigation: { goToStep, goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook();
      latestVM?.handleBack();

      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const txWithUtxo = {
        family: "bitcoin",
        utxoStrategy: { strategy: 0, excludeUTXOs: [{ hash: "a", outputIndex: 0 }] },
      };
      expect(updater(txWithUtxo)).toEqual({
        ...txWithUtxo,
        utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      });
      expect(goToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.AMOUNT);
    });
  });

  describe("handleBack — standard navigation", () => {
    it("calls goToPreviousStep when no backTarget and canGoBack()", () => {
      const { goToPreviousStep } = mockNavigation();
      const { close } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
      });

      renderHook();
      latestVM?.handleBack();

      expect(goToPreviousStep).toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it("calls close when no backTarget and !canGoBack()", () => {
      const { goToPreviousStep } = mockNavigation({ canGoBack: false });
      const { close } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => false },
      });

      renderHook();
      latestVM?.handleBack();

      expect(close).toHaveBeenCalled();
      expect(goToPreviousStep).not.toHaveBeenCalled();
    });
  });

  describe("handleBack — state cleanup", () => {
    it("resets amount-related fields and calls resetViewState when on AMOUNT step then navigates", () => {
      const { goToPreviousStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      const resetViewState = jest.fn();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.AMOUNT,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
      });

      renderHook("", resetViewState);
      latestVM?.handleBack();

      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const tx = { amount: 100, useAllAmount: true, feesStrategy: "fast" };
      const next = updater(tx);
      expect(Number(next.amount)).toBe(0);
      expect(next.useAllAmount).toBe(false);
      expect(next.feesStrategy).toBeNull();
      expect(resetViewState).toHaveBeenCalled();
      expect(goToPreviousStep).toHaveBeenCalled();
    });

    it("leaves transaction unchanged when COIN_CONTROL step but tx has no utxoStrategy", () => {
      const { goToStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.COIN_CONTROL,
        currentStepConfig: { backTarget: SEND_FLOW_STEP.AMOUNT },
        navigation: { goToStep, goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook();
      latestVM?.handleBack();

      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const ethTx = { family: "ethereum" };
      expect(updater(ethTx)).toBe(ethTx);
    });
  });
});
