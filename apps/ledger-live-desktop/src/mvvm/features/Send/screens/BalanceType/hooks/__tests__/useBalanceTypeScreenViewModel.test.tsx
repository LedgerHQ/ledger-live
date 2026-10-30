import React, { forwardRef, useImperativeHandle } from "react";
import { render, cleanup } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeOption } from "@ledgerhq/live-common/bridge/descriptor/types";
import { trackPage } from "@shared/analytics";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { useLLDCoinFamily } from "~/renderer/families";
import { useBalanceTypeScreenViewModel } from "../useBalanceTypeScreenViewModel";

let mockFamily: { SendBalanceTypeSync?: unknown } = {};
jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(() => mockFamily),
}));

// Navigation mock
const mockGoToStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(() => ({ navigation: { goToStep: mockGoToStep } })),
}));

// SendFlow context mocks
const mockSetTransaction = jest.fn();
const mockUpdateTransactionAction = jest.fn();
const mockResetRecipient = jest.fn();
const mockTransactionActions = {
  setTransaction: mockSetTransaction,
  updateTransaction: mockUpdateTransactionAction,
};

type MockAccount = { id: string; type: string; currency?: unknown; token?: unknown };

type MockState = {
  account: { account: MockAccount | null; parentAccount?: MockAccount | null };
  transaction: { transaction: { id: string; sender?: string } | null };
};

let mockState: MockState = {
  account: { account: null },
  transaction: { transaction: null },
};

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({ state: mockState })),
  useSendFlowActions: jest.fn(() => ({
    transaction: mockTransactionActions,
    resetRecipient: mockResetRecipient,
  })),
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

jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: jest.fn(() => (_from: unknown, value: unknown) => value),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  trackPage: jest.fn(),
}));

jest.mock("../../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: jest.fn(() => ({ flow: "send" })),
}));

const mockedGetBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);
const mockedTrackScreen = jest.mocked(trackPage);
const mockedUseAccountBridgeOrNull = jest.mocked(useAccountBridgeOrNull);
const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

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
    buildSelfTransferPatch: jest.fn(() => ({})),
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
    mockFamily = {};
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

    expect(renderViewModel()).toEqual(
      expect.objectContaining({
        ready: true,
        options: [
          expect.objectContaining({
            formattedBalance: expect.stringContaining("ZEC"),
            formattedCounterValue: expect.stringMatching(/.+/),
            isZero: false,
            requiresSync: false,
          }),
          expect.objectContaining({ isZero: true, requiresSync: false }),
        ],
      }),
    );
  });

  test("shows a dash and flags a sync for a pool whose balance is unknown", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, { ...PRIVATE_POOL, balance: null }]);

    expect(renderViewModel()).toEqual(
      expect.objectContaining({
        ready: true,
        options: [
          expect.objectContaining({ requiresSync: false }),
          expect.objectContaining({
            formattedBalance: "-",
            formattedCounterValue: "",
            isZero: false,
            requiresSync: true,
          }),
        ],
      }),
    );
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

  test("propagates the hidden-subtitle flag of a pool", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, { ...PRIVATE_POOL, hideSubtitle: true }]);

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      expect(vm.options[0].hideSubtitle).toBeUndefined();
      expect(vm.options[1].hideSubtitle).toBe(true);
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

      expect(mockResetRecipient).toHaveBeenCalledTimes(1);
      expect(mockUpdateTransactionAction).toHaveBeenCalledTimes(1);
      const updater = mockUpdateTransactionAction.mock.calls[0][0] as (
        tx: Record<string, unknown>,
      ) => Record<string, unknown>;
      updater({ id: "tx1" });
      expect(config.buildSelectionPatch).toHaveBeenCalledWith(optionId);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(expect.objectContaining({ id: "tx1" }), {
        sender: optionId,
      });
      expect(mockSetTransaction).not.toHaveBeenCalled();
      expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.RECIPIENT);
    },
  );

  test("keeps the recipient and the transaction when the same pool is selected again", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, PRIVATE_POOL]);
    mockState.transaction.transaction = { id: "tx1", sender: "public" };

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      vm.onSelect("public");
    }

    expect(mockResetRecipient).not.toHaveBeenCalled();
    expect(mockUpdateTransactionAction).not.toHaveBeenCalled();
    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.RECIPIENT);
  });

  test("resets the recipient when the selected pool changes", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, PRIVATE_POOL]);
    mockState.transaction.transaction = { id: "tx1", sender: "public" };

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      vm.onSelect("private");
    }

    expect(mockResetRecipient).toHaveBeenCalledTimes(1);
  });

  test("does not touch the transaction before the user selects a pool", () => {
    renderViewModel();

    expect(mockSetTransaction).not.toHaveBeenCalled();
  });

  test("ignores a pool the descriptor does not offer", () => {
    stubBalanceTypeConfig([PUBLIC_POOL]);

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      vm.onSelect("private");
    }

    expect(mockUpdateTransactionAction).not.toHaveBeenCalled();
    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  test.each(["public", "private"])(
    "onSelect(%s) moves to the balance-type sync step when the family declares one",
    optionId => {
      mockFamily = { SendBalanceTypeSync: () => null };

      const vm = renderViewModel();

      expect(vm?.ready).toBe(true);
      if (vm?.ready) {
        vm.onSelect(optionId);
      }

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.BALANCE_TYPE_SYNC);
    },
  );

  test("runs the balance-type sync again when the same pool is picked again", () => {
    mockFamily = { SendBalanceTypeSync: () => null };
    mockState.transaction.transaction = { id: "tx1", sender: "private" };

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      vm.onSelect("private");
    }

    expect(mockUpdateTransactionAction).not.toHaveBeenCalled();
    expect(mockGoToStep).toHaveBeenCalledTimes(1);
    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.BALANCE_TYPE_SYNC);
  });

  test("resolves the bridge and the family through the parent of a token account", () => {
    mockFamily = { SendBalanceTypeSync: () => null };
    const parentAccount = { id: "aleo-acc", type: "Account", currency: { family: "aleo" } };
    const tokenAccount = {
      id: "aleo-token-acc",
      type: "TokenAccount",
      token: { id: "aleo-token" },
    };
    mockState.account = { account: tokenAccount, parentAccount };

    const vm = renderViewModel();

    expect(vm?.ready).toBe(true);
    if (vm?.ready) {
      vm.onSelect("private");
    }

    expect(mockedUseAccountBridgeOrNull).toHaveBeenLastCalledWith(tokenAccount, parentAccount);
    expect(mockedUseLLDCoinFamily).toHaveBeenLastCalledWith("aleo");
    expect(mockGoToStep).toHaveBeenCalledTimes(1);
    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.BALANCE_TYPE_SYNC);
  });

  describe("page tracking", () => {
    test("emits the balance-type page event once ready, with the send-flow tracking properties", () => {
      renderViewModel();

      expect(mockedTrackScreen).toHaveBeenCalledTimes(1);
      expect(mockedTrackScreen).toHaveBeenCalledWith({
        category: "Modal send - step balance type",
        props: { flow: "send" },
      });
    });

    test("does not emit the page event before the view model is ready", () => {
      mockState.account.account = null;

      renderViewModel();

      expect(mockedTrackScreen).not.toHaveBeenCalled();
    });

    test("emits the page event only once across re-renders", () => {
      const { rerender } = render(<Harness ref={React.createRef()} />);
      rerender(<Harness ref={React.createRef()} />);

      expect(mockedTrackScreen).toHaveBeenCalledTimes(1);
    });
  });
});
