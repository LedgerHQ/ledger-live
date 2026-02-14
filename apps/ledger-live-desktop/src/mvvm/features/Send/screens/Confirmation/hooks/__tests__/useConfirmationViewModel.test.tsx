import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "tests/testSetup";
import { useConfirmationViewModel } from "../useConfirmationViewModel";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";

jest.mock("~/renderer/drawers/Provider", () => ({ setDrawer: jest.fn() }));
jest.mock("~/renderer/drawers/OperationDetails", () => ({ OperationDetails: {} }));
jest.mock("@ledgerhq/live-common/bridge/descriptor", () => ({
  sendFeatures: { isUserRefusedTransactionError: jest.fn() },
}));
jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(),
}));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowActions: jest.fn(),
  useSendFlowData: jest.fn(),
}));

import { useFlowWizard } from "../../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";

type VM = ReturnType<typeof useConfirmationViewModel>;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let latestVM: VM | null = null;

function HookProbe({ onResult }: { onResult: (vm: VM) => void }) {
  const vm = useConfirmationViewModel();
  // Call onResult during render to avoid useEffect
  onResult(vm);
  return null;
}

const mockActions = () => {
  const close = jest.fn();
  const resetStatus = jest.fn();
  const onRetry = jest.fn();
  (useSendFlowActions as jest.Mock).mockReturnValue({
    close,
    status: { resetStatus },
    operation: { onRetry },
  });
  return { close, resetStatus, onRetry };
};

const mockNavigation = () => {
  const goToStep = jest.fn();
  (useFlowWizard as jest.Mock).mockReturnValue({
    navigation: { goToStep },
  });
  return { goToStep };
};

const mockData = (state: unknown) => {
  (useSendFlowData as jest.Mock).mockReturnValue({ state });
};

beforeEach(() => {
  jest.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  latestVM = null;
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("useConfirmationViewModel", () => {
  test("status is success when signed and optimisticOperation exists", () => {
    const actions = mockActions();
    const nav = mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: { id: "parent1" },
        currency: {},
      },
      operation: {
        signed: true,
        optimisticOperation: { id: "op1" },
        transactionError: null,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });

    expect(latestVM?.status).toBe("SUCCESS");
    expect(latestVM?.transactionError).toBeNull();
    expect(actions.close).not.toHaveBeenCalled();
    expect(nav.goToStep).not.toHaveBeenCalled();
  });

  test("status is error when not signed and non-refused transactionError", () => {
    mockActions();
    mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    const error = new Error("boom");
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: null,
        currency: {},
      },
      operation: {
        signed: false,
        optimisticOperation: { id: "op1" },
        transactionError: error,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });

    expect(latestVM?.status).toBe("ERROR");
    expect(latestVM?.transactionError).toBe(error);
  });

  test("status is idle when not signed and user refused transactionError", () => {
    mockActions();
    mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(true);
    const error = new Error("refused");
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: null,
        currency: {},
      },
      operation: {
        signed: false,
        optimisticOperation: { id: "op1" },
        transactionError: error,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });

    expect(latestVM?.status).toBe("IDLE");
  });

  test("status is idle by default when no error and not signed", () => {
    mockActions();
    mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: null,
        currency: {},
      },
      operation: {
        signed: false,
        optimisticOperation: null,
        transactionError: null,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });

    expect(latestVM?.status).toBe("IDLE");
  });

  test("onViewDetails opens drawer with first subOperation when present", () => {
    const { close } = mockActions();
    mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: { id: "parent1" },
        currency: {},
      },
      operation: {
        signed: true,
        optimisticOperation: { id: "opRoot", subOperations: [{ id: "child1" }, { id: "child2" }] },
        transactionError: null,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });
    latestVM?.onViewDetails();

    expect(close).toHaveBeenCalled();
    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: "child1",
      accountId: "acc1",
      parentId: "parent1",
    });
  });

  test("onViewDetails opens drawer with optimisticOperation when no subOperations", () => {
    mockActions();
    mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: undefined,
        currency: {},
      },
      operation: {
        signed: true,
        optimisticOperation: { id: "opSingle" },
        transactionError: null,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });
    latestVM?.onViewDetails();

    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: "opSingle",
      accountId: "acc1",
      parentId: undefined,
    });
  });

  test("onViewDetails does nothing if no account or no concernedOperation", () => {
    const { close } = mockActions();
    mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    mockData({
      account: {
        account: null,
        parentAccount: { id: "parent1" },
        currency: {},
      },
      operation: {
        signed: true,
        optimisticOperation: null,
        transactionError: null,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });
    latestVM?.onViewDetails();

    expect(close).toHaveBeenCalled();
    expect(setDrawer).not.toHaveBeenCalled();
  });

  test("onRetry calls operation.onRetry, resets status and navigates to SIGNATURE", () => {
    const { resetStatus, onRetry } = mockActions();
    const { goToStep } = mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: null,
        currency: {},
      },
      operation: {
        signed: false,
        optimisticOperation: null,
        transactionError: new Error("any"),
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });
    latestVM?.onRetry();

    expect(onRetry).toHaveBeenCalled();
    expect(resetStatus).toHaveBeenCalled();
    expect(goToStep).toHaveBeenCalledWith("SIGNATURE");
  });

  test("onClose calls close", () => {
    const { close } = mockActions();
    mockNavigation();
    (sendFeatures.isUserRefusedTransactionError as jest.Mock).mockReturnValue(false);
    mockData({
      account: {
        account: { id: "acc1" },
        parentAccount: null,
        currency: {},
      },
      operation: {
        signed: true,
        optimisticOperation: { id: "op1" },
        transactionError: null,
      },
    });

    act(() => {
      root.render(<HookProbe onResult={vm => (latestVM = vm)} />);
    });
    latestVM?.onClose();

    expect(close).toHaveBeenCalled();
  });
});
