import { act, renderHook } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeOption } from "@ledgerhq/live-common/bridge/descriptor/types";
import { trackPage } from "@shared/analytics";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { isSendAccountSyncRequired } from "../../../../utils/familySendSlots";
import { useBalanceTypeScreenViewModel } from "../useBalanceTypeScreenViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: jest.fn(),
}));
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../utils/familySendSlots", () => ({
  isSendAccountSyncRequired: jest.fn(() => false),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridgeOrNull: jest.fn((account: { id: string } | null) =>
    account ? { updateTransaction: mockBridgeUpdateTransaction } : null,
  ),
}));
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getBalanceTypeConfig: jest.fn() },
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: jest.fn(() => ({ code: "ALEO", name: "ALEO", magnitude: 6 })),
}));
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: jest.fn(() => (_from: unknown, value: unknown) => value),
}));
jest.mock("../../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: jest.fn(() => ({ flow: "send" })),
}));

const mockBridgeUpdateTransaction = jest.fn(
  (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({ ...tx, ...patch }),
);
const mockNavigate = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockSetTransaction = jest.fn();
const mockResetRecipient = jest.fn();

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedGetBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);
const mockedIsSendAccountSyncRequired = jest.mocked(isSendAccountSyncRequired);
const mockedTrackPage = jest.mocked(trackPage);

const PUBLIC_POOL: BalanceTypeOption = {
  id: "public",
  translationKey: "balanceType.aleoPublic",
  balance: new BigNumber(1000),
  hasPendingBalance: false,
  icon: "check",
};

const PRIVATE_POOL: BalanceTypeOption = {
  id: "private",
  translationKey: "balanceType.aleoPrivate",
  balance: new BigNumber(2000),
  hasPendingBalance: false,
  icon: "lock",
};

type MockTransaction = { id: string; pool?: string };

const mockAccount = {
  id: "aleo-account",
  type: "Account",
  currency: { id: "aleo", family: "aleo", type: "CryptoCurrency", units: [] },
};

function stubBalanceTypeConfig(options: readonly BalanceTypeOption[]) {
  const config = {
    getOptions: jest.fn(() => options),
    getSelectedOptionId: jest.fn((tx: unknown) => (tx as MockTransaction | null)?.pool ?? null),
    buildSelectionPatch: jest.fn((optionId: string) => ({ pool: optionId })),
    getSelfTransferTarget: jest.fn(() => null),
    buildSelfTransferPatch: jest.fn(() => ({})),
    getSelectableBalance: jest.fn(() => new BigNumber(0)),
  };
  mockedGetBalanceTypeConfig.mockReturnValue(config);
  return config;
}

function mockFlowState({
  account = mockAccount,
  transaction = { id: "tx1" },
}: {
  account?: typeof mockAccount | null;
  transaction?: MockTransaction | null;
} = {}) {
  mockedUseSendFlowData.mockReturnValue({
    state: {
      account: { account, parentAccount: null },
      transaction: { transaction },
    },
  } as never);
}

function renderViewModel() {
  return renderHook(() => useBalanceTypeScreenViewModel());
}

function getReadyViewModel(result: { current: ReturnType<typeof useBalanceTypeScreenViewModel> }) {
  const viewModel = result.current;
  if (!viewModel.ready) throw new Error("view model not ready");
  return viewModel;
}

describe("useBalanceTypeScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsSendAccountSyncRequired.mockReturnValue(false);
    mockedUseNavigation.mockReturnValue({ navigate: mockNavigate } as never);
    mockedUseSendFlowActions.mockReturnValue({
      transaction: { updateTransaction: mockUpdateTransaction, setTransaction: mockSetTransaction },
      resetRecipient: mockResetRecipient,
    } as never);
    stubBalanceTypeConfig([PUBLIC_POOL, PRIVATE_POOL]);
    mockFlowState();
  });

  it("GIVEN no account WHEN rendered THEN the view model is not ready", () => {
    mockFlowState({ account: null });

    const { result } = renderViewModel();

    expect(result.current.ready).toBe(false);
  });

  it("GIVEN no transaction WHEN rendered THEN the view model is not ready", () => {
    mockFlowState({ transaction: null });

    const { result } = renderViewModel();

    expect(result.current.ready).toBe(false);
  });

  it("GIVEN a currency without balance pools WHEN rendered THEN the view model is not ready", () => {
    mockedGetBalanceTypeConfig.mockReturnValue(null);

    const { result } = renderViewModel();

    expect(result.current.ready).toBe(false);
  });

  it("GIVEN two pools WHEN rendered THEN each pool becomes an option in descriptor order", () => {
    const { result } = renderViewModel();

    const viewModel = getReadyViewModel(result);
    expect(viewModel.options.map(option => option.id)).toEqual(["public", "private"]);
    expect(viewModel.options.map(option => option.translationKey)).toEqual([
      "balanceType.aleoPublic",
      "balanceType.aleoPrivate",
    ]);
  });

  it("GIVEN an empty pool WHEN rendered THEN its balance is formatted and flagged as zero", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, { ...PRIVATE_POOL, balance: new BigNumber(0) }]);

    const { result } = renderViewModel();

    const viewModel = getReadyViewModel(result);
    expect(viewModel.options[0].formattedBalance).toBeTruthy();
    expect(viewModel.options[0].isZero).toBe(false);
    expect(viewModel.options[1].isZero).toBe(true);
  });

  it("GIVEN a pool whose balance is unknown WHEN rendered THEN a placeholder is shown", () => {
    stubBalanceTypeConfig([PUBLIC_POOL, { ...PRIVATE_POOL, balance: null }]);

    const { result } = renderViewModel();

    const viewModel = getReadyViewModel(result);
    expect(viewModel.options[1].formattedBalance).toBe("-");
    expect(viewModel.options[1].formattedCounterValue).toBe("");
    expect(viewModel.options[1].isZero).toBe(false);
  });

  it("GIVEN a selected pool WHEN rendered THEN it is read from the descriptor", () => {
    mockFlowState({ transaction: { id: "tx1", pool: "private" } });

    const { result } = renderViewModel();

    expect(getReadyViewModel(result).selectedOptionId).toBe("private");
  });

  it.each(["public", "private"])(
    "GIVEN no selected pool WHEN %s is selected THEN the descriptor patch is applied and the recipient step opens",
    optionId => {
      const config = stubBalanceTypeConfig([PUBLIC_POOL, PRIVATE_POOL]);

      const { result } = renderViewModel();
      act(() => getReadyViewModel(result).onSelect(optionId));

      expect(mockResetRecipient).toHaveBeenCalledTimes(1);
      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
      const updater = mockUpdateTransaction.mock.calls[0][0] as (
        tx: Record<string, unknown>,
      ) => Record<string, unknown>;
      updater({ id: "tx1" });
      expect(config.buildSelectionPatch).toHaveBeenCalledWith(optionId, { id: "tx1" });
      expect(mockBridgeUpdateTransaction).toHaveBeenCalledWith({ id: "tx1" }, { pool: optionId });
      expect(mockSetTransaction).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendFlowRecipient);
    },
  );

  it("GIVEN a selected pool WHEN the same pool is selected again THEN the recipient is kept", () => {
    mockFlowState({ transaction: { id: "tx1", pool: "public" } });

    const { result } = renderViewModel();
    act(() => getReadyViewModel(result).onSelect("public"));

    expect(mockResetRecipient).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendFlowRecipient);
  });

  it("GIVEN a pool the descriptor does not offer WHEN it is selected THEN nothing happens", () => {
    stubBalanceTypeConfig([PUBLIC_POOL]);

    const { result } = renderViewModel();
    act(() => getReadyViewModel(result).onSelect("private"));

    expect(mockUpdateTransaction).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("GIVEN a pick that needs an account sync WHEN a pool is selected THEN the sync step opens", () => {
    mockedIsSendAccountSyncRequired.mockReturnValue(true);

    const { result } = renderViewModel();
    act(() => getReadyViewModel(result).onSelect("private"));

    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    expect(mockedIsSendAccountSyncRequired).toHaveBeenCalledWith(mockAccount, {
      id: "tx1",
      pool: "private",
    });
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendFlowAccountSync);
  });

  it("GIVEN a ready view model WHEN rendered several times THEN the page is tracked once", () => {
    const { rerender } = renderViewModel();
    rerender({});

    expect(mockedTrackPage).toHaveBeenCalledTimes(1);
    expect(mockedTrackPage).toHaveBeenCalledWith({
      category: "Modal send - step balance type",
      props: { flow: "send" },
    });
  });

  it("GIVEN a view model that is not ready WHEN rendered THEN no page is tracked", () => {
    mockFlowState({ account: null });

    renderViewModel();

    expect(mockedTrackPage).not.toHaveBeenCalled();
  });
});
