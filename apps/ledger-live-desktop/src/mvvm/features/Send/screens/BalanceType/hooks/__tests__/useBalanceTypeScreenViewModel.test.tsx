import React, { forwardRef, useImperativeHandle } from "react";
import { render, cleanup } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeOption } from "@ledgerhq/live-common/bridge/descriptor/types";
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
  account: { account: { id: string; type: string; currency: unknown } | null };
  transaction: { transaction: { id: string; sender?: string } | null };
};

let mockState: MockState = {
  account: { account: null },
  transaction: { transaction: null },
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
  useAccountBridgeOrNull: jest.fn((account: { id: string } | null) =>
    account ? { updateTransaction: mockUpdateTransaction } : null,
  ),
}));

// The send descriptor is the only source of balance pools: the view model must read the
// pools, the selection and its patch from it, and never from a coin-module.
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getBalanceTypeConfig: jest.fn() },
}));

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: jest.fn(() => ({ code: "ZEC", name: "ZEC", magnitude: 8 })),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  CountervaluesProvider: ({ children }: { children: React.ReactNode }) => children,
  useCalculateCountervalueCallback: jest.fn(() => (_from: unknown, value: unknown) => value),
}));

const mockedGetBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);

const PUBLIC_POOL: BalanceTypeOption = {
  id: "public",
  translationKey: "balanceType.transparent",
  balance: new BigNumber(1000),
  hasPendingBalance: false,
  icon: "check",
};

const PRIVATE_POOL: BalanceTypeOption = {
  id: "private",
  translationKey: "balanceType.shielded",
  balance: new BigNumber(2000),
  hasPendingBalance: false,
  icon: "lock",
};

function stubBalanceTypeConfig(options: readonly BalanceTypeOption[]) {
  const config = {
    getOptions: jest.fn(() => options),
    getSelectedOptionId: jest.fn((tx: unknown) => (tx as { sender?: string })?.sender ?? null),
    buildSelectionPatch: jest.fn((optionId: string) => ({ sender: optionId })),
    getSelfTransferTarget: jest.fn(() => null),
    getSelectableBalance: jest.fn(
      ({ optionId }: { optionId: string }) =>
        options.find(o => o.id === optionId)?.balance ?? new BigNumber(0),
    ),
  };
  mockedGetBalanceTypeConfig.mockReturnValue(config);
  return config;
}

// Harness to expose hook API
type HookApi = ReturnType<typeof useBalanceTypeScreenViewModel>;
const Harness = forwardRef<HookApi>(function Harness(_props, ref) {
  const api = useBalanceTypeScreenViewModel();
  useImperativeHandle(ref, () => api);
  return null;
});

function renderViewModel(): HookApi | null {
  const ref = React.createRef<HookApi>();
  render(<Harness ref={ref} />);
  return ref.current;
}

describe("useBalanceTypeScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateTransaction.mockImplementation((tx, patch) => ({ ...tx, ...patch }));
    stubBalanceTypeConfig([PUBLIC_POOL, PRIVATE_POOL]);

    mockState = {
      account: { account: { id: "zcash-acc", type: "Account", currency: { id: "zcash" } } },
      transaction: { transaction: { id: "tx1", sender: undefined } },
    };
  });

  afterEach(() => {
    cleanup();
  });

  test("returns { ready: false } when account is null", () => {
    mockState.account.account = null;

    expect(renderViewModel()?.ready).toBe(false);
  });

  test("returns { ready: false } when transaction is null", () => {
    mockState.transaction.transaction = null;

    expect(renderViewModel()?.ready).toBe(false);
  });

  test("returns { ready: false } when the currency declares no balance pools", () => {
    mockedGetBalanceTypeConfig.mockReturnValue(null);

    expect(renderViewModel()?.ready).toBe(false);
  });

  test("exposes one option per pool declared by the descriptor, in order", () => {
    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.options.map(option => option.id)).toEqual(["public", "private"]);
      expect(vm.options.map(option => option.translationKey)).toEqual([
        "balanceType.transparent",
        "balanceType.shielded",
      ]);
    }
  });

  test("formats each pool balance and flags the empty ones", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, { ...PRIVATE_POOL, balance: new BigNumber(0) }]);

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.options[0].formattedBalance).toBeTruthy();
      expect(vm.options[0].formattedCounterValue).toBeTruthy();
      expect(vm.options[0].isZero).toBe(false);
      expect(vm.options[1].isZero).toBe(true);
    }
  });

  test("propagates the pending-balance flag of a pool", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, { ...PRIVATE_POOL, hasPendingBalance: true }]);

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.options[0].hasPendingBalance).toBe(false);
      expect(vm.options[1].hasPendingBalance).toBe(true);
    }
  });

  test.each([
    ["no pool is selected yet", undefined, null],
    ["the first pool is selected", "public", "public"],
    ["the second pool is selected", "private", "private"],
  ])("reads the selected pool from the descriptor when %s", (_label, sender, expected) => {
    mockState.transaction.transaction = { id: "tx1", sender };

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.selectedOptionId).toBe(expected);
    }
  });

  test.each(["public", "private"])(
    "onSelect(%s) applies the descriptor patch and moves to the recipient step",
    optionId => {
      const config = stubBalanceTypeConfig([PUBLIC_POOL, PRIVATE_POOL]);

      const vm = renderViewModel();

      expect(vm?.ready).toBe(true);
      if (vm?.ready) {
        vm.onSelect(optionId);
      }

      expect(config.buildSelectionPatch).toHaveBeenCalledWith(optionId);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(expect.objectContaining({ id: "tx1" }), {
        sender: optionId,
      });
      expect(mockSetTransaction).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.RECIPIENT);
    },
  );

  test("does not touch the transaction before the user selects a pool", () => {
    renderViewModel();

    expect(mockSetTransaction).not.toHaveBeenCalled();
  });
});
