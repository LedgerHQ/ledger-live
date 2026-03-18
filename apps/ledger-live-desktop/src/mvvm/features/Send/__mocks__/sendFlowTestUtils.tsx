import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import type { Transaction as BtcTransaction } from "@ledgerhq/coin-bitcoin/types";
import { SendWorkflow } from "../index";

export { screen, waitFor };

export type MockTransactionStatus = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees?: BigNumber;
  txOutputs?: ReadonlyArray<{ isChange: boolean; value: BigNumber }>;
};

let mockBridgeRecipientValidation = { errors: {}, warnings: {}, isLoading: false };
let mockDeviceActionResult: unknown = null;

const mockSetTransaction = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockSetAccount = jest.fn();
const mockRecentAddressesStore = {
  getAddresses: jest.fn(() => []),
  addAddress: jest.fn(),
  removeAddress: jest.fn(),
};

export const VALID_EVM_RECIPIENT = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
export const VALID_BTC_RECIPIENT = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

export const createResolvedStatus = (
  errors: Record<string, Error> = {},
  overrides?: Partial<MockTransactionStatus>,
): MockTransactionStatus => ({
  errors,
  warnings: {},
  estimatedFees: new BigNumber(0),
  ...overrides,
});

const defaultEvmTransaction: EvmTransaction = {
  family: "evm",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  subAccountId: null,
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  type: 2,
  maxFeePerGas: new BigNumber(0),
  maxPriorityFeePerGas: new BigNumber(0),
  feesStrategy: "medium",
};

export const createMinimalEvmTransaction = (overrides?: Partial<EvmTransaction>): Transaction => {
  const { gasPrice: _g, mode: _m, nft: _nft, ...rest } = overrides ?? {};
  const tx: EvmTransaction = {
    ...defaultEvmTransaction,
    ...rest,
    type: 2,
    mode: "send",
    nft: undefined,
  };
  return tx;
};

const defaultBtcTransaction: BtcTransaction = {
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  feesStrategy: "medium",
  feePerByte: new BigNumber(10),
  networkInfo: null,
  rbf: false,
  utxoStrategy: { strategy: 0, excludeUTXOs: [] },
};

export const createMinimalBtcTransaction = (overrides?: Partial<BtcTransaction>): Transaction => ({
  ...defaultBtcTransaction,
  ...overrides,
});

let mockTransaction: Transaction = createMinimalEvmTransaction();
let mockStatus: MockTransactionStatus = createResolvedStatus();
let mockBridgePending = false;
let mockStatusResolver: ((transaction: Transaction) => MockTransactionStatus) | null = null;

const getResolvedStatus = (transaction: Transaction) =>
  mockStatusResolver ? mockStatusResolver(transaction) : mockStatus;

export const resetBridgeState = (family: string) => {
  mockTransaction =
    family === "bitcoin" ? createMinimalBtcTransaction() : createMinimalEvmTransaction();
  mockStatus = createResolvedStatus();
  mockBridgePending = false;
  mockStatusResolver = null;
};

export const setMockTransaction = (transaction: Transaction) => {
  mockTransaction = transaction;
};

export const setMockStatus = (status: MockTransactionStatus) => {
  mockStatus = status;
};

export const setMockStatusResolver = (
  resolver: ((transaction: Transaction) => MockTransactionStatus) | null,
) => {
  mockStatusResolver = resolver;
};

export const setMockBridgeRecipientValidation = (
  validation: typeof mockBridgeRecipientValidation,
) => {
  mockBridgeRecipientValidation = validation;
};

export const setMockDeviceActionResult = (result: unknown) => {
  mockDeviceActionResult = result;
};

export const resetSendFlowTestState = (family = "evm") => {
  jest.clearAllMocks();
  resetBridgeState(family);
  setMockDeviceActionResult(null);
  setMockBridgeRecipientValidation({ errors: {}, warnings: {}, isLoading: false });
};

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  marketApi: {
    reducerPath: "marketApi",
    reducer: (state = {}) => state,
    middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
  },
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () =>
  jest.fn(() => {
    const [transaction, setTransactionState] = React.useState(mockTransaction);
    const status = React.useMemo(() => getResolvedStatus(transaction), [transaction]);

    const setTransaction = (nextTransaction: Transaction) => {
      mockTransaction = nextTransaction;
      mockSetTransaction(nextTransaction);
      setTransactionState(nextTransaction);
    };

    const updateTransaction = (updater: (transaction: Transaction) => Transaction) => {
      mockUpdateTransaction(updater);
      setTransactionState(previousTransaction => {
        const nextTransaction = updater(previousTransaction);
        mockTransaction = nextTransaction;
        return nextTransaction;
      });
    };

    return {
      transaction,
      setTransaction,
      updateTransaction,
      status,
      bridgeError: null,
      bridgePending: mockBridgePending,
      setAccount: mockSetAccount,
    };
  }),
);

const mockBridgeUpdateTransaction = jest.fn(
  (transaction: Transaction, patch: Partial<Transaction>) => ({
    ...transaction,
    ...patch,
  }),
);
const mockPrepareTransaction = jest.fn((_account: unknown, tx: Transaction) => Promise.resolve(tx));
const mockGetTransactionStatus = jest.fn(() => Promise.resolve(mockStatus));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => ({
    updateTransaction: mockBridgeUpdateTransaction,
    prepareTransaction: mockPrepareTransaction,
    getTransactionStatus: mockGetTransactionStatus,
    estimateMaxSpendable: jest.fn(() => Promise.resolve(new BigNumber("1000000000000000000"))),
  })),
  getCurrencyBridge: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  getAccountBridge: jest.fn(() => ({
    updateTransaction: mockBridgeUpdateTransaction,
    prepareTransaction: mockPrepareTransaction,
    getTransactionStatus: mockGetTransactionStatus,
    estimateMaxSpendable: jest.fn(() => Promise.resolve(new BigNumber("1000000000000000000"))),
  })),
  getCurrencyBridge: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/domain-service/hooks/index", () => ({
  DomainServiceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDomain: jest.fn(() => ({ status: "idle", resolutions: [] })),
}));

jest.mock("@ledgerhq/coin-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn(() => Promise.resolve(false)),
}));

jest.mock("@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation", () => ({
  useBridgeRecipientValidation: jest.fn(() => mockBridgeRecipientValidation),
}));

jest.mock("@ledgerhq/live-common/account/index", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/account/index");
  return {
    ...actual,
    getRecentAddressesStore: () => mockRecentAddressesStore,
  };
});

jest.mock("~/renderer/components/DeviceAction", () => {
  const MockDeviceAction = ({
    onResult,
  }: {
    onResult: (r: unknown) => void;
    Result: React.FC<unknown>;
  }) => {
    React.useEffect(() => {
      if (mockDeviceActionResult) {
        onResult(mockDeviceActionResult);
      }
    }, [onResult]);
    return <div>Waiting for device...</div>;
  };
  return { __esModule: true, default: MockDeviceAction };
});

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  useTransactionAction: jest.fn(() => jest.fn()),
}));

jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: jest.fn(() =>
    jest.fn(() =>
      Promise.resolve({
        id: "op-1",
        hash: "0xabc",
        type: "OUT",
        value: new BigNumber(1000),
        fee: new BigNumber(100),
        senders: ["sender"],
        recipients: ["recipient"],
        accountId: "mock-account-id",
        date: new Date(),
        blockHeight: null,
        blockHash: null,
        extra: {},
      }),
    ),
  ),
}));

const ethCurrency = getCryptoCurrencyById("ethereum");
const btcCurrency = getCryptoCurrencyById("bitcoin");

export const createEthereumAccount = (overrides?: Partial<Account>): Account => {
  const account = genAccount("send-integration-test");
  return {
    ...account,
    id: "mock-account-id",
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    balance: new BigNumber("1000000000000000000"),
    spendableBalance: new BigNumber("1000000000000000000"),
    currency: ethCurrency,
    ...overrides,
  };
};

export const createBitcoinAccount = (overrides?: Partial<Account>): Account => {
  const account = genAccount("send-bitcoin-integration-test");
  return {
    ...account,
    id: "mock-bitcoin-account-id",
    freshAddress: "bc1qk9we6m4zw6h7t5x9dp4f5fux0rlq2l9r2z6h6m",
    balance: new BigNumber("100000000"),
    spendableBalance: new BigNumber("100000000"),
    currency: btcCurrency,
    ...overrides,
  };
};

export const renderSendFlow = (account: Account) =>
  render(<SendWorkflow isOpen onClose={jest.fn()} params={{ account }} />, {
    initialState: {
      accounts: [account],
      settings: {
        counterValue: "USD",
        counterValueExchange: "BINANCE",
        currenciesSettings: {},
      },
    },
  });

export async function navigateToAmountScreen(
  user: ReturnType<typeof render>["user"],
  recipient = VALID_EVM_RECIPIENT,
) {
  const recipientInput = await screen.findByTestId("send-recipient-input");
  await user.type(recipientInput, recipient);
  const matchedButton = await screen.findByTestId("send-matched-address-button");
  await user.click(matchedButton);
  expect(await screen.findByTestId("send-amount-step")).toBeVisible();
}

export async function openFeeMenu(user: ReturnType<typeof render>["user"]) {
  await user.click(screen.getByTestId("send-network-fees-menu-trigger"));
}

export async function openCustomFeesScreen(user: ReturnType<typeof render>["user"]) {
  await openFeeMenu(user);
  await user.click(await screen.findByTestId("send-custom-fees-menu-item"));
}

export async function openCoinControlScreen(user: ReturnType<typeof render>["user"]) {
  await openFeeMenu(user);
  await user.click(await screen.findByTestId("send-coin-control-fees-menu-item"));
}
