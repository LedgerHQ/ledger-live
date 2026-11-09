/**
 * @jest-environment jsdom
 */
import type { SendAccountLike, SendTransaction, SendTransactionStatus } from "../../../registry";
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import type { CoinControlConfig, CoinControlDisplayData } from "../../../descriptor/types";
import { useCoinControlScreenViewModelCore } from "../useCoinControlScreenViewModelCore";
import { getAccountCurrency } from "../../../internals/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  createMockSendFeatures,
  createSendFlowPortsWrapper,
  createTestSendFlowPorts,
} from "../../../test-utils/sendFlowPorts";

class NotEnoughBalance extends Error {
  override name = "NotEnoughBalance";
}

const bitcoinPickingStrategy = { MERGE_OUTPUTS: 2, CUSTOM: 3 } as const;

const mockedSendFeatures = createMockSendFeatures();
const mockGetAccountBridge = jest.fn();
const wrapper = createSendFlowPortsWrapper(
  createTestSendFlowPorts({
    sendFeatures: mockedSendFeatures,
    getAccountBridge: mockGetAccountBridge,
  }),
);
jest.mock("../useCoinControlAmountInput", () => ({
  useCoinControlAmountInput: () => ({
    amountValue: null,
    onAmountChange: jest.fn(),
    cancelPendingUpdates: jest.fn(),
    debounceTimeoutRef: { current: null },
  }),
}));
jest.mock("@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));

const mockOnLearnMore = jest.fn();

const mockGetCoinControlConfig = mockedSendFeatures.getCoinControlConfig;

function makeTestCoinControlConfig(
  getDisplayData: () => CoinControlDisplayData | null,
  overrides?: Partial<Pick<CoinControlConfig, "buildToggleRowExclusionPatch">>,
): CoinControlConfig {
  return {
    customStrategyValue: bitcoinPickingStrategy.CUSTOM,
    getDisplayData,
    buildStrategyChangePatch: ({ strategy }) => ({ utxoStrategy: { strategy } }),
    buildToggleRowExclusionPatch: overrides?.buildToggleRowExclusionPatch ?? (() => null),
  };
}

const createAccount = (): SendAccountLike => {
  const currency = getCryptoCurrencyById("bitcoin");
  return {
    type: "Account",
    id: "bitcoin-account",
    name: "Bitcoin",
    currency,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    blockHeight: 800000,
    lastSyncDate: new Date(),
  } as unknown as SendAccountLike;
};

const createTransaction = (): SendTransaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
  }) as unknown as SendTransaction;

const createStatus = (): SendTransactionStatus =>
  ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
  }) as SendTransactionStatus;

const mockLabels = {
  reviewCta: "Review",
  getCtaLabel: (currency: string) => `Get ${currency}`,
  strategyLabel: "Strategy",
  coinToSendLabel: "Coin to send",
  changeToReturnLabel: "Change to return",
  enterAmountPlaceholder: "Enter amount",
  selectSufficientCoinsPlaceholder: "Select sufficient coins",
  amountToSendLabel: "Amount to send",
  amountInputLabel: "Amount",
  getStrategyOptionLabel: (key: string) => key,
};

const row = (
  hash: string,
  outputIndex: number,
  excluded: boolean,
): CoinControlDisplayData["utxoRows"][number] => ({
  rowKey: `${hash}-${outputIndex}`,
  titleLabel: "#",
  formattedValue: "1 BTC",
  excluded,
  exclusionReason: excluded ? ("userExclusion" as const) : undefined,
  isUsedInTx: false,
  unconfirmed: false,
  disabled: false,
  confirmations: 1,
});

function mockBridgeMergePatch(): void {
  mockGetAccountBridge.mockResolvedValue({
    updateTransaction: (tx: SendTransaction, patch: Partial<SendTransaction>) => ({
      ...tx,
      ...patch,
    }),
  });
}

function customTransaction(amount: BigNumber): SendTransaction {
  return {
    ...createTransaction(),
    amount,
    useAllAmount: false,
    utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
  } as unknown as SendTransaction;
}

function displayDataForCustomRows(
  utxoRows: CoinControlDisplayData["utxoRows"],
): CoinControlDisplayData {
  return {
    pickingStrategyOptions: [],
    pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
    totalExcludedUTXOS: utxoRows.filter(r => r.excluded).length,
    totalSpent: new BigNumber(0),
    utxoRows,
  };
}

function statusNotEnoughBalance(): SendTransactionStatus {
  return {
    ...createStatus(),
    errors: { amount: new NotEnoughBalance("Insufficient funds") },
  } as unknown as SendTransactionStatus;
}

function statusWithChangeOutput(value: BigNumber): SendTransactionStatus {
  return {
    ...createStatus(),
    errors: {},
    txOutputs: [{ isChange: true, value }],
  } as unknown as SendTransactionStatus;
}

function renderCoinControlCore(params: {
  displayDataFactory?: () => CoinControlDisplayData | null;
  transaction: SendTransaction;
  status?: SendTransactionStatus;
  bridgePending?: boolean;
  amountError?: string;
  buildToggleRowExclusionPatch?: CoinControlConfig["buildToggleRowExclusionPatch"];
  updateTransaction?: jest.Mock;
}) {
  mockBridgeMergePatch();
  mockGetCoinControlConfig.mockReturnValue(
    makeTestCoinControlConfig(
      params.displayDataFactory ?? (() => null),
      params.buildToggleRowExclusionPatch != null
        ? { buildToggleRowExclusionPatch: params.buildToggleRowExclusionPatch }
        : undefined,
    ),
  );
  const account = createAccount();
  const updateTransaction =
    params.updateTransaction ??
    jest.fn((fn: (tx: SendTransaction) => SendTransaction) => fn(params.transaction));
  return {
    updateTransaction,
    ...renderHook(
      () =>
        useCoinControlScreenViewModelCore({
          account,
          parentAccount: null,
          transaction: params.transaction,
          status: params.status ?? createStatus(),
          bridgePending: params.bridgePending ?? false,
          uiConfig: { hasCoinControl: true } as never,
          transactionActions: { updateTransaction } as never,
          locale: "en",
          accountUnit: getAccountCurrency(account).units[0],
          amountError: params.amountError,
          networkFees: {},
          labels: mockLabels,
          onLearnMoreClick: mockOnLearnMore,
        }),
      { wrapper },
    ),
  };
}

describe("useCoinControlScreenViewModelCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinControlConfig.mockImplementation(() => null);
  });

  it("returns expected shape with minimal params", () => {
    mockGetCoinControlConfig.mockReturnValue(makeTestCoinControlConfig(() => null));

    const account = createAccount();
    const transaction = createTransaction();
    const status = createStatus();
    const updateTransaction = jest.fn((fn: (tx: SendTransaction) => SendTransaction) =>
      fn(transaction),
    );
    mockGetAccountBridge.mockResolvedValue({
      updateTransaction: (tx: SendTransaction, patch: Partial<SendTransaction>) => ({
        ...tx,
        ...patch,
      }),
    });

    const { result } = renderHook(
      () =>
        useCoinControlScreenViewModelCore({
          account,
          parentAccount: null,
          transaction,
          status,
          bridgePending: false,
          uiConfig: { hasCoinControl: true } as never,
          transactionActions: { updateTransaction } as never,
          locale: "en",
          accountUnit: getAccountCurrency(account).units[0],
          amountError: undefined,
          networkFees: {},
          labels: mockLabels,
          onLearnMoreClick: mockOnLearnMore,
        }),
      { wrapper },
    );

    expect(result.current).toMatchObject({
      amountError: undefined,
      reviewShowIcon: true,
      strategyLabel: "Strategy",
      isCustomPickingStrategy: false,
    });
    expect(typeof result.current.onAmountChange).toBe("function");
    expect(typeof result.current.onSelectStrategy).toBe("function");
    expect(result.current.onLearnMoreClick).toBe(mockOnLearnMore);
  });

  it("calls onLearnMoreClick when passed", () => {
    mockGetCoinControlConfig.mockReturnValue(makeTestCoinControlConfig(() => null));

    mockGetAccountBridge.mockResolvedValue({
      updateTransaction: (tx: SendTransaction, patch: Partial<SendTransaction>) => ({
        ...tx,
        ...patch,
      }),
    });
    const account = createAccount();
    const { result } = renderHook(
      () =>
        useCoinControlScreenViewModelCore({
          account,
          parentAccount: null,
          transaction: createTransaction(),
          status: createStatus(),
          bridgePending: false,
          uiConfig: {} as never,
          transactionActions: { updateTransaction: jest.fn() } as never,
          locale: "en",
          accountUnit: getAccountCurrency(account).units[0],
          amountError: undefined,
          networkFees: { fee: "data" },
          labels: mockLabels,
          onLearnMoreClick: mockOnLearnMore,
        }),
      { wrapper },
    );

    result.current.onLearnMoreClick();
    expect(mockOnLearnMore).toHaveBeenCalledTimes(1);
    expect(result.current.networkFees).toEqual({ fee: "data" });
  });

  describe("isCustomPickingStrategy", () => {
    it("is false when coin control config is missing", () => {
      mockGetCoinControlConfig.mockReturnValue(null);
      mockBridgeMergePatch();
      const account = createAccount();
      const transaction = customTransaction(new BigNumber(1000));
      const { result } = renderHook(
        () =>
          useCoinControlScreenViewModelCore({
            account,
            parentAccount: null,
            transaction,
            status: createStatus(),
            bridgePending: false,
            uiConfig: { hasCoinControl: true } as never,
            transactionActions: { updateTransaction: jest.fn() } as never,
            locale: "en",
            accountUnit: getAccountCurrency(account).units[0],
            amountError: undefined,
            networkFees: {},
            labels: mockLabels,
            onLearnMoreClick: mockOnLearnMore,
          }),
        { wrapper },
      );
      expect(result.current.isCustomPickingStrategy).toBe(false);
    });

    it("is false when strategy is not CUSTOM", () => {
      const { result } = renderCoinControlCore({
        transaction: createTransaction(),
      });
      expect(result.current.isCustomPickingStrategy).toBe(false);
    });

    it("is true when strategy is CUSTOM and config exists", () => {
      const { result } = renderCoinControlCore({
        transaction: customTransaction(new BigNumber(1000)),
      });
      expect(result.current.isCustomPickingStrategy).toBe(true);
    });
  });

  describe("onToggleUtxoExclusion", () => {
    const rowKey = "tx1-0";
    const togglePatch = {
      utxoStrategy: {
        strategy: bitcoinPickingStrategy.CUSTOM,
        excludeUTXOs: [{ hash: "tx1", outputIndex: 0 }],
      },
    };

    it("calls buildToggleRowExclusionPatch with transaction, rowKey, and displayData then updateTransaction when custom strategy and config exist", async () => {
      const transaction = customTransaction(new BigNumber(1000));
      const displayData = displayDataForCustomRows([row("tx1", 0, false)]);
      const buildToggleRowExclusionPatch = jest.fn().mockReturnValue(togglePatch);

      const { result, updateTransaction } = renderCoinControlCore({
        displayDataFactory: () => displayData,
        transaction,
        buildToggleRowExclusionPatch,
      });

      expect(typeof result.current.onToggleUtxoExclusion).toBe("function");
      result.current.onToggleUtxoExclusion!(rowKey);

      expect(buildToggleRowExclusionPatch).toHaveBeenCalledTimes(1);
      expect(buildToggleRowExclusionPatch).toHaveBeenCalledWith({
        transaction,
        rowKey,
        displayData,
      });
      await Promise.resolve();
      expect(updateTransaction).toHaveBeenCalledTimes(1);
    });

    it("does not call updateTransaction when buildToggleRowExclusionPatch returns null", () => {
      const transaction = customTransaction(new BigNumber(1000));
      const buildToggleRowExclusionPatch = jest.fn().mockReturnValue(null);

      const { result, updateTransaction } = renderCoinControlCore({
        displayDataFactory: () => displayDataForCustomRows([row("tx1", 0, false)]),
        transaction,
        buildToggleRowExclusionPatch,
      });

      result.current.onToggleUtxoExclusion!(rowKey);

      expect(buildToggleRowExclusionPatch).toHaveBeenCalledTimes(1);
      expect(updateTransaction).not.toHaveBeenCalled();
    });

    it("does not call buildToggleRowExclusionPatch or updateTransaction when strategy is not custom", () => {
      const buildToggleRowExclusionPatch = jest.fn().mockReturnValue(togglePatch);

      const { result, updateTransaction } = renderCoinControlCore({
        displayDataFactory: () => displayDataForCustomRows([row("tx1", 0, false)]),
        transaction: createTransaction(),
        buildToggleRowExclusionPatch,
      });

      result.current.onToggleUtxoExclusion!(rowKey);

      expect(buildToggleRowExclusionPatch).not.toHaveBeenCalled();
      expect(updateTransaction).not.toHaveBeenCalled();
    });

    it("does not call updateTransaction when coin control config is missing", () => {
      mockBridgeMergePatch();
      mockGetCoinControlConfig.mockReturnValue(null);
      const account = createAccount();
      const transaction = customTransaction(new BigNumber(1000));
      const updateTransaction = jest.fn();

      const { result } = renderHook(
        () =>
          useCoinControlScreenViewModelCore({
            account,
            parentAccount: null,
            transaction,
            status: createStatus(),
            bridgePending: false,
            uiConfig: { hasCoinControl: true } as never,
            transactionActions: { updateTransaction } as never,
            locale: "en",
            accountUnit: getAccountCurrency(account).units[0],
            amountError: undefined,
            networkFees: {},
            labels: mockLabels,
            onLearnMoreClick: mockOnLearnMore,
          }),
        { wrapper },
      );

      expect(result.current.isCustomPickingStrategy).toBe(false);
      result.current.onToggleUtxoExclusion!(rowKey);
      expect(updateTransaction).not.toHaveBeenCalled();
    });
  });

  describe("CUSTOM strategy (amount error, NotEnoughBalance, change)", () => {
    const txFilled = () => customTransaction(new BigNumber(5000));

    it("hides amountError when amount is not filled", () => {
      const { result } = renderCoinControlCore({
        transaction: customTransaction(new BigNumber(0)),
        amountError: "Some amount error",
      });
      expect(result.current.amountError).toBeUndefined();
    });

    it("still shows amountError when amount is filled", () => {
      const { result } = renderCoinControlCore({
        transaction: customTransaction(new BigNumber(1000)),
        amountError: "Some amount error",
      });
      expect(result.current.amountError).toBe("Some amount error");
    });

    it("hides NotEnoughBalance when amount filled and no UTXO is selected", () => {
      const { result } = renderCoinControlCore({
        displayDataFactory: () =>
          displayDataForCustomRows([row("tx1", 0, true), row("tx2", 1, true)]),
        transaction: txFilled(),
        status: statusNotEnoughBalance(),
        amountError: "Insufficient funds",
      });
      expect(result.current.amountError).toBeUndefined();
      expect(result.current.changeToReturn.value).toBe("");
      expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
      expect(result.current.changeToReturn.placeholder).toBe("Select sufficient coins");
    });

    it("still shows NotEnoughBalance when at least one UTXO is selected", () => {
      const { result } = renderCoinControlCore({
        displayDataFactory: () =>
          displayDataForCustomRows([row("tx1", 0, false), row("tx2", 1, true)]),
        transaction: txFilled(),
        status: statusNotEnoughBalance(),
        amountError: "Insufficient funds",
      });
      expect(result.current.amountError).toBe("Insufficient funds");
      expect(result.current.changeToReturn.value).toBe("");
      expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
      expect(result.current.changeToReturn.placeholder).toBe("Select sufficient coins");
    });

    it("hides NotEnoughBalance while bridgePending (stale status after UTXO toggle)", () => {
      const { result } = renderCoinControlCore({
        displayDataFactory: () =>
          displayDataForCustomRows([row("tx1", 0, false), row("tx2", 1, true)]),
        transaction: txFilled(),
        status: statusNotEnoughBalance(),
        bridgePending: true,
        amountError: "Insufficient funds",
      });
      expect(result.current.amountError).toBeUndefined();
    });

    it("formats change to return when selection covers amount and there is no NotEnoughBalance", () => {
      const { result } = renderCoinControlCore({
        displayDataFactory: () =>
          displayDataForCustomRows([row("tx1", 0, false), row("tx2", 1, false)]),
        transaction: txFilled(),
        status: statusWithChangeOutput(new BigNumber(3500)),
      });
      expect(result.current.changeToReturn.value).toBe("3500 BTC");
      expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
      expect(result.current.changeToReturn.placeholder).toBe("Enter amount");
    });
  });

  describe("hasAmount", () => {
    it("is false when amount is zero and useAllAmount is false", () => {
      const { result } = renderCoinControlCore({ transaction: createTransaction() });
      expect(result.current.hasAmount).toBe(false);
    });

    it("is true when amount is greater than zero", () => {
      const { result } = renderCoinControlCore({
        transaction: {
          ...createTransaction(),
          amount: new BigNumber(1000),
        } as unknown as SendTransaction,
      });
      expect(result.current.hasAmount).toBe(true);
    });

    it("is true when useAllAmount is set even if amount is zero", () => {
      const { result } = renderCoinControlCore({
        transaction: {
          ...createTransaction(),
          useAllAmount: true,
          amount: new BigNumber(0),
        } as unknown as SendTransaction,
      });
      expect(result.current.hasAmount).toBe(true);
    });

    it("is false when amount is undefined", () => {
      const { result } = renderCoinControlCore({
        transaction: {
          ...createTransaction(),
          amount: undefined,
        } as unknown as SendTransaction,
      });
      expect(result.current.hasAmount).toBe(false);
    });
  });
});
