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
jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn(),
}));

import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../../context/SendFlowContext";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";

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
    account: { currency: { ticker: "ETH" }, account: {} },
    recipient: null,
    transaction: { status: {} },
  });
  (useMaybeAccountName as jest.Mock).mockReturnValue("Base 1");
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("useSendHeaderModel", () => {
  describe("recipient header summary", () => {
    it("shows the default send title and account summary on recipient step", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: { addressInput: true, showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("$5,969.83");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("Base 1 · $5,969.83");
    });

    it("falls back to the balance only in description when account name is unavailable", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: { addressInput: true, showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });
      (useMaybeAccountName as jest.Mock).mockReturnValue(undefined);

      renderHook("$5,969.83");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("$5,969.83");
    });
  });

  describe("handleBack — floating steps (history-based)", () => {
    it("calls goToPreviousStep when on CUSTOM_FEES step and canGoBack()", () => {
      const { goToStep, goToPreviousStep } = mockNavigation();
      const { close } = mockActions();
      const resetViewState = jest.fn();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.CUSTOM_FEES,
        currentStepConfig: {},
        navigation: { goToStep, goToPreviousStep, canGoBack: () => true },
      });

      renderHook("", resetViewState);
      latestVM?.handleBack();

      expect(goToPreviousStep).toHaveBeenCalled();
      expect(goToStep).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it("runs COIN_CONTROL cleanup then calls goToPreviousStep on COIN_CONTROL step", () => {
      const { goToPreviousStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.COIN_CONTROL,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
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
      expect(goToPreviousStep).toHaveBeenCalled();
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

  describe("descriptionText — account summary", () => {
    it("shows the account summary on non-recipient steps too", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.AMOUNT,
        currentStepConfig: { showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("Base 1 · 1 ETH");
    });

    it("hides the account summary when showAvailable is false", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.AMOUNT,
        currentStepConfig: { showTitle: true, showAvailable: false },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("");
    });

    it("uses the per-step titleKey override when defined", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.CUSTOM_FEES,
        currentStepConfig: { showTitle: true, titleKey: "newSendFlow.customFees.title" },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("Custom fees");
    });

    it("hides the summary when the step title is hidden", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.SIGNATURE,
        currentStepConfig: { showTitle: false },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("");
      expect(latestVM?.descriptionText).toBe("");
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
      const { goToPreviousStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.COIN_CONTROL,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
      });

      renderHook();
      latestVM?.handleBack();

      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const ethTx = { family: "ethereum" };
      expect(updater(ethTx)).toBe(ethTx);
    });
  });
});
