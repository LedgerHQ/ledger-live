import BigNumber from "bignumber.js";
import { act, renderHook } from "@tests/test-renderer";
import { track } from "@shared/analytics";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useFeeSelectionStepViewModel } from "./useFeeSelectionStepViewModel";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/flows/send/uiConfig", () => ({
  getSendUiConfig: jest.fn(() => ({ hasFiatAmountInput: false })),
}));

jest.mock("@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects", () => ({
  useFlowEffects: jest.fn(() => ({ loading: false, error: null })),
}));

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { hasFeeRateLegend: jest.fn(() => false) },
}));

const mockSelectFeeStrategyId = jest.fn();
jest.mock("@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore", () => ({
  useNetworkFeesCore: ({ transaction }: { transaction: { feesStrategy?: string } }) => ({
    feesRowValue: "0.000021 ETH",
    feesRowSecondaryValue: null,
    selectedFeeStrategy: transaction.feesStrategy ?? null,
    selectedFeeStrategyId: transaction.feesStrategy ?? "medium",
    feeStrategyOptions: [
      {
        id: "medium",
        kind: "preset",
        sublabelFiat: null,
        sublabelCrypto: null,
        sublabelLegend: null,
      },
    ],
    onSelectFeeStrategyId: mockSelectFeeStrategyId,
    hasCustomFees: true,
    hasCoinControl: false,
  }),
}));

const mockedUseBridgeTransaction = jest.mocked(useBridgeTransaction);

const ethereum = {
  type: "CryptoCurrency",
  id: "ethereum",
  family: "evm",
  name: "Ethereum",
  ticker: "ETH",
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
};
const account = { id: "js:2:ethereum:0xabc:", type: "Account", currency: ethereum };
const tokenAccount = {
  id: "js:2:ethereum:0xabc:+usdc",
  type: "TokenAccount",
  parentId: account.id,
  token: {
    type: "TokenCurrency",
    id: "ethereum/erc20/usdc",
    name: "USD Coin",
    ticker: "USDC",
    parentCurrencyId: "ethereum",
    units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
  },
};

const preparedTransaction = { family: "evm", feesStrategy: "custom" } as unknown as Transaction;

function mockBridgeTransaction({
  errors = {},
  bridgePending = false,
}: { errors?: Record<string, Error>; bridgePending?: boolean } = {}) {
  mockedUseBridgeTransaction.mockReturnValue({
    transaction: preparedTransaction,
    setTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    account,
    parentAccount: undefined,
    setAccount: jest.fn(),
    updateAccount: jest.fn(),
    status: {
      errors,
      warnings: {},
      amount: new BigNumber(0),
      estimatedFees: new BigNumber("21000000000000"),
      totalSpent: new BigNumber("21000000000000"),
    },
    bridgeError: null,
    bridgePending,
  } as unknown as ReturnType<typeof useBridgeTransaction>);
}

function setup(overrides: { account?: AccountLike; hasFeesProvided?: boolean } = {}) {
  const onConfirm = jest.fn();
  const onOpenCustomFees = jest.fn();
  const utils = renderHook(() =>
    useFeeSelectionStepViewModel({
      account: overrides.account ?? (account as unknown as AccountLike),
      parentAccount: overrides.account
        ? (account as unknown as Parameters<
            typeof useFeeSelectionStepViewModel
          >[0]["parentAccount"])
        : undefined,
      transaction: { family: "evm" } as unknown as Transaction,
      hasFeesProvided: overrides.hasFeesProvided ?? false,
      manifestId: "ledger-wallet-connect",
      manifestName: "WalletConnect",
      sourceFlow: "wallet_connect",
      onOpenCustomFees,
      onConfirm,
    }),
  );
  return { ...utils, onConfirm, onOpenCustomFees };
}

describe("useFeeSelectionStepViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBridgeTransaction();
  });

  it("hands the prepared transaction over on continue", () => {
    const { result, onConfirm } = setup();

    expect(result.current.canContinue).toBe(true);
    act(() => result.current.onContinue());

    expect(onConfirm).toHaveBeenCalledWith(preparedTransaction);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "continue", manifestId: "ledger-wallet-connect" }),
    );
  });

  it("keeps the user on the step while the transaction is being prepared", () => {
    mockBridgeTransaction({ bridgePending: true });
    const { result, onConfirm } = setup();

    expect(result.current.canContinue).toBe(false);
    act(() => result.current.onContinue());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows the transaction error and blocks the device step", () => {
    const notEnoughGas = new Error("not enough gas");
    notEnoughGas.name = "NotEnoughGas";
    mockBridgeTransaction({ errors: { gasPrice: notEnoughGas } });
    const { result } = setup();

    expect(result.current.error).not.toBeNull();
    expect(result.current.canContinue).toBe(false);
  });

  it("labels the custom entry with the live app's fees and opens the custom fees form", () => {
    const { result, onOpenCustomFees } = setup({ hasFeesProvided: true });
    const custom = result.current.feeOptions.find(option => option.kind === "custom");

    expect(custom).toEqual(
      expect.objectContaining({
        label: "Fees from WalletConnect",
        selected: true,
        sublabel: "0.000021 ETH",
      }),
    );
    act(() => custom!.onSelect());
    expect(onOpenCustomFees).toHaveBeenCalledTimes(1);
  });

  it("selects a fee preset", () => {
    const { result } = setup();

    act(() => result.current.feeOptions.find(option => option.id === "medium")!.onSelect());

    expect(mockSelectFeeStrategyId).toHaveBeenCalledWith("medium");
  });

  it("shows the total for a native transaction only", () => {
    expect(setup().result.current.total).toMatch(/^0\.000021\sETH$/);
    expect(
      setup({ account: tokenAccount as unknown as AccountLike }).result.current.total,
    ).toBeNull();
  });
});
