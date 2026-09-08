import React, { forwardRef, useImperativeHandle } from "react";
import { render, cleanup } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useBalanceTypeScreenViewModel } from "../useBalanceTypeScreenViewModel";

// Navigation mock
const mockGoToStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(() => ({ navigation: { goToStep: mockGoToStep } })),
}));

// SendFlow context mocks
const mockSetTransaction = jest.fn();
const mockTransactionActions = { setTransaction: mockSetTransaction };

type MockState = {
  account: {
    account: { id: string; bitcoinResources?: { utxos?: unknown[] } } | null;
    parentAccount: null;
    currency: null;
  };
  transaction: {
    transaction: { id: string; sender?: string } | null;
    status: Record<string, unknown>;
    bridgeError: null;
    bridgePending: false;
  };
};

let mockState: MockState = {
  account: {
    account: { id: "zcash-acc", bitcoinResources: { utxos: [] } },
    parentAccount: null,
    currency: null,
  },
  transaction: {
    transaction: { id: "tx1", sender: undefined },
    status: {},
    bridgeError: null,
    bridgePending: false,
  },
};

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({ state: mockState })),
  useSendFlowActions: jest.fn(() => ({ transaction: mockTransactionActions })),
}));

// Bridge mock
const mockUpdateTransaction = jest.fn(
  (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({ ...tx, ...patch }),
);
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(() => ({ updateTransaction: mockUpdateTransaction })),
}));

// Coin-zcash balance helpers — use jest.fn() directly to avoid spread type errors
jest.mock("@ledgerhq/coin-zcash/logic/account/balance", () => ({
  getTransparentBalance: jest.fn(),
}));

jest.mock("@ledgerhq/coin-zcash/logic/account/spendability", () => ({
  getSpendableIronwoodBalance: jest.fn(),
  hasMaturingIronwoodNotes: jest.fn(),
}));

jest.mock("@ledgerhq/coin-zcash/bridge/note-reservation", () => ({
  getReservedNullifiers: jest.fn(),
}));

// Harness to expose hook API
type HookApi = ReturnType<typeof useBalanceTypeScreenViewModel>;
const Harness = forwardRef<HookApi>(function Harness(_props, ref) {
  const api = useBalanceTypeScreenViewModel();
  useImperativeHandle(ref, () => api);
  return null;
});

describe("useBalanceTypeScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateTransaction.mockImplementation((tx, patch) => ({ ...tx, ...patch }));

    // Configure coin-zcash module mocks via requireMock
    const balanceMock = jest.requireMock("@ledgerhq/coin-zcash/logic/account/balance") as {
      getTransparentBalance: jest.Mock;
    };
    const spendabilityMock = jest.requireMock(
      "@ledgerhq/coin-zcash/logic/account/spendability",
    ) as {
      getSpendableIronwoodBalance: jest.Mock;
      hasMaturingIronwoodNotes: jest.Mock;
    };
    const noteReservationMock = jest.requireMock(
      "@ledgerhq/coin-zcash/bridge/note-reservation",
    ) as {
      getReservedNullifiers: jest.Mock;
    };

    balanceMock.getTransparentBalance.mockReturnValue(new BigNumber(1000));
    spendabilityMock.getSpendableIronwoodBalance.mockReturnValue(new BigNumber(2000));
    spendabilityMock.hasMaturingIronwoodNotes.mockReturnValue(false);
    noteReservationMock.getReservedNullifiers.mockReturnValue(new Set());

    mockState = {
      account: {
        account: { id: "zcash-acc", bitcoinResources: { utxos: [] } },
        parentAccount: null,
        currency: null,
      },
      transaction: {
        transaction: { id: "tx1", sender: undefined },
        status: {},
        bridgeError: null,
        bridgePending: false,
      },
    };
  });

  afterEach(() => {
    cleanup();
  });

  test("returns { ready: false } when account is null", () => {
    mockState.account.account = null;

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    expect(ref.current?.ready).toBe(false);
  });

  test("returns { ready: false } when transaction is null", () => {
    mockState.transaction.transaction = null;

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    expect(ref.current?.ready).toBe(false);
  });

  test("returns correct transparentOption.balance from getTransparentBalance", () => {
    const balanceMock = jest.requireMock("@ledgerhq/coin-zcash/logic/account/balance") as {
      getTransparentBalance: jest.Mock;
    };
    balanceMock.getTransparentBalance.mockReturnValue(new BigNumber(5000));

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.transparentOption.balance.toNumber()).toBe(5000);
    }
  });

  test("returns correct shieldedOption.balance from getSpendableIronwoodBalance", () => {
    const spendabilityMock = jest.requireMock(
      "@ledgerhq/coin-zcash/logic/account/spendability",
    ) as {
      getSpendableIronwoodBalance: jest.Mock;
      hasMaturingIronwoodNotes: jest.Mock;
    };
    spendabilityMock.getSpendableIronwoodBalance.mockReturnValue(new BigNumber(9999));

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.shieldedOption.balance.toNumber()).toBe(9999);
    }
  });

  test("shieldedOption.hasMaturingNotes is true when hasMaturingIronwoodNotes returns true", () => {
    const spendabilityMock = jest.requireMock(
      "@ledgerhq/coin-zcash/logic/account/spendability",
    ) as {
      getSpendableIronwoodBalance: jest.Mock;
      hasMaturingIronwoodNotes: jest.Mock;
    };
    spendabilityMock.hasMaturingIronwoodNotes.mockReturnValue(true);

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.shieldedOption.hasMaturingNotes).toBe(true);
    }
  });

  test("selectedSender is null when tx.sender is undefined", () => {
    mockState.transaction.transaction = { id: "tx1", sender: undefined };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.selectedSender).toBeNull();
    }
  });

  test("selectedSender is 'public' when tx.sender is 'public'", () => {
    mockState.transaction.transaction = { id: "tx1", sender: "public" };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.selectedSender).toBe("public");
    }
  });

  test("selectedSender is 'private' when tx.sender is 'private'", () => {
    mockState.transaction.transaction = { id: "tx1", sender: "private" };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.selectedSender).toBe("private");
    }
  });

  test("onSelect('public') calls setTransaction with sender: 'public' and navigates to RECIPIENT", () => {
    mockState.transaction.transaction = { id: "tx1", sender: "private" };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      vm.onSelect("public");
    }

    expect(mockUpdateTransaction).toHaveBeenCalledWith(expect.objectContaining({ id: "tx1" }), {
      sender: "public",
    });
    expect(mockSetTransaction).toHaveBeenCalledTimes(1);
    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.RECIPIENT);
  });

  test("onSelect('private') calls setTransaction with sender: 'private' and navigates to RECIPIENT", () => {
    mockState.transaction.transaction = { id: "tx1", sender: "public" };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const vm = ref.current;
    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      vm.onSelect("private");
    }

    expect(mockUpdateTransaction).toHaveBeenCalledWith(expect.objectContaining({ id: "tx1" }), {
      sender: "private",
    });
    expect(mockSetTransaction).toHaveBeenCalledTimes(1);
    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.RECIPIENT);
  });

  test("does not set tx.sender before the user selects an option", () => {
    mockState.transaction.transaction = { id: "tx1", sender: undefined };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    expect(mockSetTransaction).not.toHaveBeenCalled();
  });
});
