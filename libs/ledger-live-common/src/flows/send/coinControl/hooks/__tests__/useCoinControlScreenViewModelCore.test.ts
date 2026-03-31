/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { NotEnoughBalance } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { renderHook } from "@testing-library/react";
import type {
  CoinControlConfig,
  CoinControlDisplayData,
} from "../../../../../bridge/descriptor/types";
import { useCoinControlScreenViewModelCore } from "../useCoinControlScreenViewModelCore";
import type { Transaction, TransactionStatus } from "../../../../../generated/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoCurrencyById } from "../../../../../currencies";
import { bitcoinCoinControlConfig } from "../../../../../families/bitcoin/descriptor/coinControl";
import { bitcoinPickingStrategy } from "../../../../../families/bitcoin/types";

jest.mock("../../../../../bridge/impl");
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  getMainAccount: jest.fn((acc: AccountLike) => acc),
  getAccountCurrency: jest.fn((acc: AccountLike) => (acc as { currency: unknown }).currency),
}));
jest.mock("../../../../../bridge/descriptor/send/features", () => {
  const actual = jest.requireActual("../../../../../bridge/descriptor/send/features");
  return {
    ...actual,
    sendFeatures: {
      ...actual.sendFeatures,
      getCoinControlConfig: jest.fn(),
    },
  };
});
jest.mock("../useCoinControlAmountInput", () => ({
  useCoinControlAmountInput: () => ({
    amountValue: null,
    onAmountChange: jest.fn(),
    cancelPendingUpdates: jest.fn(),
    debounceTimeoutRef: { current: null },
  }),
}));
jest.mock("@ledgerhq/coin-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));

const mockOnLearnMore = jest.fn();

const { sendFeatures } = jest.requireMock("../../../../../bridge/descriptor/send/features") as {
  sendFeatures: { getCoinControlConfig: jest.Mock };
};
const mockGetCoinControlConfig = sendFeatures.getCoinControlConfig as jest.Mock;

function makeTestCoinControlConfig(
  getDisplayData: () => CoinControlDisplayData | null,
): CoinControlConfig {
  return {
    customStrategyValue: bitcoinCoinControlConfig.customStrategyValue,
    getDisplayData,
    buildStrategyChangePatch: bitcoinCoinControlConfig.buildStrategyChangePatch,
    buildToggleRowExclusionPatch: bitcoinCoinControlConfig.buildToggleRowExclusionPatch,
  };
}

const createAccount = (): AccountLike => {
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
  } as unknown as AccountLike;
};

const createTransaction = (): Transaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
  }) as unknown as Transaction;

const createStatus = (): TransactionStatus =>
  ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
  }) as TransactionStatus;

const mockLabels = {
  reviewCta: "Review",
  getCtaLabel: (currency: string) => `Get ${currency}`,
  strategyLabel: "Strategy",
  learnMoreLabel: "Learn more",
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
  jest.requireMock("../../../../../bridge/impl").getAccountBridge.mockReturnValue({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  });
}

function customTransaction(amount: BigNumber): Transaction {
  return {
    ...createTransaction(),
    amount,
    useAllAmount: false,
    utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
  } as unknown as Transaction;
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

function statusNotEnoughBalance(): TransactionStatus {
  return {
    ...createStatus(),
    errors: { amount: new NotEnoughBalance("Insufficient funds") },
  } as unknown as TransactionStatus;
}

function statusWithChangeOutput(value: BigNumber): TransactionStatus {
  return {
    ...createStatus(),
    errors: {},
    txOutputs: [{ isChange: true, value }],
  } as unknown as TransactionStatus;
}

function renderCoinControlCore(params: {
  displayDataFactory?: () => CoinControlDisplayData | null;
  transaction: Transaction;
  status?: TransactionStatus;
  bridgePending?: boolean;
  amountError?: string;
}) {
  mockBridgeMergePatch();
  mockGetCoinControlConfig.mockReturnValue(
    makeTestCoinControlConfig(params.displayDataFactory ?? (() => null)),
  );
  const account = createAccount();
  return renderHook(() =>
    useCoinControlScreenViewModelCore({
      account,
      parentAccount: null,
      transaction: params.transaction,
      status: params.status ?? createStatus(),
      bridgePending: params.bridgePending ?? false,
      uiConfig: { hasCoinControl: true } as never,
      transactionActions: { updateTransaction: jest.fn() } as never,
      locale: "en",
      accountUnit: getAccountCurrency(account).units[0],
      amountError: params.amountError,
      networkFees: {},
      labels: mockLabels,
      onLearnMoreClick: mockOnLearnMore,
    }),
  );
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
    const updateTransaction = jest.fn((fn: (tx: Transaction) => Transaction) => fn(transaction));
    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });

    const { result } = renderHook(() =>
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
    );

    expect(result.current).toMatchObject({
      amountError: undefined,
      reviewShowIcon: true,
      strategyLabel: "Strategy",
      learnMoreLabel: "Learn more",
      isCustomPickingStrategy: false,
    });
    expect(typeof result.current.onAmountChange).toBe("function");
    expect(typeof result.current.onSelectStrategy).toBe("function");
    expect(result.current.onLearnMoreClick).toBe(mockOnLearnMore);
  });

  it("calls onLearnMoreClick when passed", () => {
    mockGetCoinControlConfig.mockReturnValue(makeTestCoinControlConfig(() => null));

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();
    const { result } = renderHook(() =>
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
      const { result } = renderHook(() =>
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
      expect(result.current.changeToReturnFormatted).toBe("");
      expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
      expect(result.current.changeToReturnPlaceholder).toBe("Select sufficient coins");
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
      expect(result.current.changeToReturnFormatted).toBe("");
      expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
      expect(result.current.changeToReturnPlaceholder).toBe("Select sufficient coins");
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
      expect(result.current.changeToReturnFormatted).toBe("3500 BTC");
      expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
      expect(result.current.changeToReturnPlaceholder).toBe("Enter amount");
    });
  });
});
