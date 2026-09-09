import React from "react";
import { render, screen, waitFor, act, withFlagOverrides } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Contact } from "@domain/entity-contact";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SponsoredCoinApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import type { SponsoredState } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SendWorkflow } from "../index";

export { screen, waitFor, act };

type SupportedMockFamily = "bitcoin" | "evm" | "tron";
type EvmTransaction = Extract<Transaction, { family: "evm" }>;
type BtcTransaction = Extract<Transaction, { family: "bitcoin" }>;
type TronTransaction = Extract<Transaction, { family: "tron" }>;

export type MockTransactionStatus = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees?: BigNumber;
  txOutputs?: ReadonlyArray<{ isChange: boolean; value: BigNumber }>;
};

let mockBridgeRecipientValidation = { errors: {}, warnings: {}, isLoading: false };
let mockDeviceActionResult: unknown = null;
let mockScannedCode = "";
let mockContacts: readonly Contact[] = [];
let mockContactsFeatureEnabled = false;

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

const defaultTronTransaction: TronTransaction = {
  family: "tron",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  subAccountId: null,
};

export const createMinimalTronTransaction = (
  overrides?: Partial<TronTransaction>,
): Transaction => ({
  ...defaultTronTransaction,
  ...overrides,
});

const transactionFactories: Record<SupportedMockFamily, () => Transaction> = {
  bitcoin: createMinimalBtcTransaction,
  evm: createMinimalEvmTransaction,
  tron: createMinimalTronTransaction,
};

let mockTransaction: Transaction = createMinimalEvmTransaction();
let mockStatus: MockTransactionStatus = createResolvedStatus();
let mockBridgePending = false;
let mockStatusResolver: ((transaction: Transaction) => MockTransactionStatus) | null = null;

const getResolvedStatus = (transaction: Transaction) =>
  mockStatusResolver ? mockStatusResolver(transaction) : mockStatus;

export const resetBridgeState = (family: SupportedMockFamily) => {
  mockTransaction = transactionFactories[family]();
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

export const setMockScannedCode = (code: string) => {
  mockScannedCode = code;
};

export const setMockContacts = (contacts: readonly Contact[], isEnabled = true) => {
  mockContacts = contacts;
  mockContactsFeatureEnabled = isEnabled;
};

/**
 * Fake seam for the TRON Tronify sponsored-send flow (bridge/generic-coin-framework/sponsored),
 * mirroring useSponsoredFee.test.tsx's own `fakeSeam`. `null` (the default) makes
 * getSponsoredCoinApi resolve null exactly like a non-TRON/unconfigured family, so the existing
 * EVM/BTC suites never touch this seam.
 */
let mockSponsoredApi: SponsoredCoinApi | null = null;
// Opaque intent handed to the seam methods and to useSponsoredSendOrchestration; a plain object is
// enough since every consumer treats it as unknown at this seam boundary.
const mockSponsoredIntent: unknown = { kind: "mock-sponsored-intent" };

function fakeSponsoredSeam(overrides: Partial<SponsoredCoinApi> = {}): SponsoredCoinApi {
  return {
    listFeeOptions: jest.fn().mockResolvedValue([]),
    estimateSponsoredFeeQuote: jest
      .fn()
      .mockResolvedValue({ value: 0n, originalValue: 0n, savings: 0n }),
    buildEnergyRentRequest: jest.fn().mockResolvedValue({
      payerAddress: "TPayerAddress",
      receiverAddress: "TReceiverAddress",
      energy: 1000n,
      durationSeconds: 60,
    }),
    craftEnergyRentTransaction: jest.fn(),
    submitEnergyRentPayment: jest.fn().mockResolvedValue(undefined),
    getEnergyRentStatus: jest.fn().mockResolvedValue("pending"),
    awaitEnergyDelivery: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export const setMockSponsoredSeam = (overrides: Partial<SponsoredCoinApi>) => {
  mockSponsoredApi = fakeSponsoredSeam(overrides);
};

/** Convenience for the two delivery outcomes the orchestration branches on: an immediate resolve
 * (delivered) or a rejection shaped exactly like useSponsoredSendOrchestration's own timeout match
 * (`error.name === "EnergyDelegationTimeoutError"`) -> phase FAILED / failureKind DELIVERY_FAILED. */
export const setMockSponsoredDelivery = (outcome: "delivered" | "timeout") => {
  if (!mockSponsoredApi) return;
  mockSponsoredApi.awaitEnergyDelivery =
    outcome === "delivered"
      ? jest.fn().mockResolvedValue(undefined)
      : jest.fn().mockRejectedValue(
          Object.assign(new Error("energy delivery timed out"), {
            name: "EnergyDelegationTimeoutError",
          }),
        );
};

export const resetSendFlowTestState = (family: SupportedMockFamily = "evm") => {
  jest.clearAllMocks();
  resetBridgeState(family);
  setMockDeviceActionResult(null);
  setMockBridgeRecipientValidation({ errors: {}, warnings: {}, isLoading: false });
  setMockScannedCode("");
  setMockContacts([], false);
  mockSponsoredApi = null;
  resetMockOrchestration();
};

// Mock boundary: the seam + the device, never the real orchestration/context. Resolving null by
// default (no test has opted in via setMockSponsoredSeam) keeps every non-sponsored suite on its
// existing not-sponsored path with zero behavior change.
jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(() => Promise.resolve(mockSponsoredApi)),
  SPONSORED_FEE_OPTION_ID: "tronify",
}));

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/buildIntent", () => ({
  buildGenericTransactionIntent: jest.fn(() => Promise.resolve(mockSponsoredIntent)),
}));

// Mock boundary: the real useSponsoredSendOrchestration hook is swapped for this fully test-driven
// fake so the integration tests can step phases deterministically. The SPONSORED_POLLING screen
// runs a live setInterval elapsed timer, and driving the real orchestration through POLLING under
// real timers makes React's act() flush loop never quiesce (the flow hangs to the jest timeout —
// non-deterministic across machines). Driving phases directly through this fake sidesteps that
// timer/act() interaction while still exercising the real desktop screens + routing. The real
// orchestration's own phase transitions are covered by its unit tests
// (libs/ledger-live-common/src/flows/send/sponsored/useSponsoredSendOrchestration.test.ts).
const initialMockOrchestrationState: SponsoredState = {
  phase: SPONSORED_PHASE.RENT_SIGNING,
  order: null,
  paymentTxId: null,
  failureKind: null,
  failureError: null,
};
let mockOrchestrationState: SponsoredState = initialMockOrchestrationState;
let mockOrchestrationSetState: ((state: SponsoredState) => void) | null = null;

export const mockSponsoredOrchestrationActions = {
  craftRent: jest.fn(() => Promise.resolve()),
  startRentPayment: jest.fn(() => Promise.resolve()),
  onTransferSuccess: jest.fn(),
  onTransferError: jest.fn(),
  setContractDataFailure: jest.fn(),
  retry: jest.fn(),
  reset: jest.fn(),
};

/** Pushes a patch onto the fake orchestration's shared state and (once a component has mounted the
 * mocked hook) re-renders it — call inside `act()`/`await act(async () => ...)` from the test. */
export const setMockOrchestrationState = (patch: Partial<SponsoredState>) => {
  mockOrchestrationState = { ...mockOrchestrationState, ...patch };
  mockOrchestrationSetState?.(mockOrchestrationState);
};

const resetMockOrchestration = () => {
  mockOrchestrationState = initialMockOrchestrationState;
  mockOrchestrationSetState = null;
};

jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration", () => ({
  useSponsoredSendOrchestration: () => {
    const [state, setState] = React.useState(mockOrchestrationState);
    mockOrchestrationSetState = setState;
    return { state, actions: mockSponsoredOrchestrationActions };
  },
}));

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
  getAccountBridge: jest.fn(() => {
    const bridge = {
      updateTransaction: mockBridgeUpdateTransaction,
      prepareTransaction: mockPrepareTransaction,
      getTransactionStatus: mockGetTransactionStatus,
      estimateMaxSpendable: jest.fn(() => Promise.resolve(new BigNumber("1000000000000000000"))),
    };
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge });
  }),
  getCurrencyBridge: jest.fn(() => {
    const bridge = {};
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge });
  }),
  getAccountBridgeByFamily: jest.fn(async () => ({
    validateAddress: jest.fn(async () => true),
  })),
}));

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  getAccountBridge: jest.fn(() => {
    const bridge = {
      updateTransaction: mockBridgeUpdateTransaction,
      prepareTransaction: mockPrepareTransaction,
      getTransactionStatus: mockGetTransactionStatus,
      estimateMaxSpendable: jest.fn(() => Promise.resolve(new BigNumber("1000000000000000000"))),
    };
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge });
  }),
  getCurrencyBridge: jest.fn(() => {
    const bridge = {};
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge });
  }),
  getAccountBridgeByFamily: jest.fn(async () => ({
    validateAddress: jest.fn(async () => true),
  })),
}));

jest.mock("@ledgerhq/domain-service/hooks/index", () => ({
  DomainServiceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDomain: jest.fn(() => ({ status: "idle", resolutions: [] })),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn(() => Promise.resolve(false)),
}));

jest.mock("@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation", () => ({
  useBridgeRecipientValidation: jest.fn(() => mockBridgeRecipientValidation),
}));

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  useContacts: () => mockContacts,
  useContactsFeature: () => ({
    isEnabled: mockContactsFeatureEnabled,
    showNewBadge: false,
    eligibleAddressFamilies: ["evm"],
  }),
}));

jest.mock("@features/platform-contacts/device");

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

// jsdom has no camera: stub the scanner panel with a button that emits a scanned code
jest.mock("../screens/Recipient/components/RecipientQrScanner", () => {
  const MockRecipientQrScanner = ({ onPick }: { onPick: (code: string) => void }) => (
    <div data-testid="send-recipient-qr-scanner">
      <button type="button" data-testid="mock-qrcode-pick" onClick={() => onPick(mockScannedCode)}>
        camera
      </button>
    </div>
  );
  return { RecipientQrScanner: MockRecipientQrScanner };
});

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  useTransactionAction: jest.fn(() => jest.fn()),
  // Used by SponsoredRentSignatureScreen (TX-A, raw-sign, never broadcast) — kept alongside
  // useTransactionAction so that screen doesn't crash calling an unmocked export.
  useRawTransactionAction: jest.fn(() => jest.fn()),
}));

// A single stable function reused across renders — useSendFlowSignatureCore's onDeviceActionResult
// is a useCallback keyed on `broadcast`, and MockDeviceAction's own mount effect is keyed on
// `[onResult]`; a fresh broadcast identity per render makes onResult churn every render, re-firing
// the mount effect indefinitely ("Maximum update depth exceeded") the moment a test actually drives
// DeviceAction through to broadcast (never exercised by the EVM/BTC suites, which only assert the
// signature screen renders).
const mockBroadcast = jest.fn(() =>
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
);

jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: jest.fn(() => mockBroadcast),
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

const tronCurrency = getCryptoCurrencyById("tron");

export const VALID_TRON_RECIPIENT = "TWKsL6EqQgQXqhq6cJnP2sQrbUdRJDvUCX";

export const createTronAccount = (overrides?: Partial<Account>): Account => {
  const account = genAccount("send-tron-integration-test");
  return {
    ...account,
    id: "mock-tron-account-id",
    freshAddress: "TLsV52sRDL79HXGGm9yzwKibb6BeruhUzy",
    // 100 TRX in sun — well above the 1000-sun sponsored quote used by the sponsored-send tests.
    balance: new BigNumber("100000000"),
    spendableBalance: new BigNumber("100000000"),
    currency: tronCurrency,
    ...overrides,
  };
};

export const renderSendFlow = (
  account: Account,
  params: Omit<NonNullable<React.ComponentProps<typeof SendWorkflow>["params"]>, "account"> = {},
  options?: { flags?: Parameters<typeof withFlagOverrides>[0] },
) =>
  render(<SendWorkflow isOpen onClose={jest.fn()} params={{ account, ...params }} />, {
    initialState: {
      accounts: [account],
      settings: {
        counterValue: "USD",
        counterValueExchange: "BINANCE",
        currenciesSettings: {},
      },
      ...(options?.flags ? withFlagOverrides(options.flags) : {}),
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
