/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { Provider, createStore, useSetAtom } from "jotai";
import BigNumber from "bignumber.js";
import { currentAccountAtomFamily, useDappLogic } from "./useDappLogic";
import { AppBranch, AppPlatform, Visibility } from "./types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("./converters", () => ({
  getWalletAPITransactionSignFlowInfos: jest.fn(),
}));

jest.mock("../hw/signMessage/index", () => ({
  prepareMessageToSign: jest.fn(),
}));

jest.mock("../account", () => ({
  getParentAccount: jest.fn().mockReturnValue(undefined),
  getMainAccount: jest.fn().mockImplementation((account: unknown) => account),
}));

jest.mock("../bridge", () => ({
  getAccountBridge: jest.fn().mockResolvedValue({
    broadcast: jest.fn(),
  }),
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue(true),
  changes: { subscribe: jest.fn() },
}));

jest.mock("@ledgerhq/live-network/network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/coin-evm/utils", () => ({
  safeEncodeEIP55: (addr: string) => addr,
}));

jest.mock("./SmartWebsocket", () => ({
  SmartWebsocket: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock("./utils/txTrackingHelper", () => ({
  getTxType: jest.fn().mockReturnValue("transfer"),
}));

jest.mock("./utils/ledgerButtonTracking", () => ({
  isLedgerButtonReferrer: jest.fn().mockReturnValue(false),
  reportLedgerButtonBroadcast: jest.fn(),
}));

jest.mock("@ledgerhq/cryptoassets/state", () => ({
  getCryptoAssetsStore: jest.fn().mockReturnValue({
    findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
    findTokenById: jest.fn().mockResolvedValue(null),
  }),
}));

// ---- shared test fixtures ----

const mockCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  coinType: 60,
  name: "Ethereum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "ethereum",
  color: "#0ebdcd",
  symbol: "Ξ",
  family: "evm",
  blockAvgTime: 15,
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
  keywords: ["eth", "ethereum"],
  explorerViews: [],
};

const mockAccount: Account = {
  type: "Account",
  id: "mock-account-id",
  seedIdentifier: "0x1234",
  derivationMode: "",
  index: 0,
  freshAddress: "0xDEADBEEF",
  freshAddressPath: "44'/60'/0'/0/0",
  used: false,
  blockHeight: 0,
  creationDate: new Date(),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  currency: mockCurrency,
  lastSyncDate: new Date(),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  syncHash: "",
  subAccounts: [],
  nfts: [],
};

const mockManifest = {
  id: "test-dapp-usedapplogic",
  name: "Test DApp",
  url: "https://test.app",
  homepageUrl: "https://test.app",
  icon: "icon",
  apiVersion: "1.0.0",
  permissions: [],
  domains: [],
  categories: [],
  platforms: ["desktop"] as AppPlatform[],
  manifestVersion: "1.0.0",
  branch: "stable" as AppBranch,
  currencies: [],
  visibility: "complete" as Visibility,
  content: { shortDescription: { en: "test" }, description: { en: "test" } },
  dapp: {
    nanoApp: "Ethereum",
    dependencies: [],
    networks: [{ currency: "ethereum", chainID: 1 }],
  },
};

const mockTracking = {
  dappPersonalSignRequested: jest.fn(),
  dappPersonalSignSuccess: jest.fn(),
  dappPersonalSignFail: jest.fn(),
  dappSignTypedDataRequested: jest.fn(),
  dappSignTypedDataSuccess: jest.fn(),
  dappSignTypedDataFail: jest.fn(),
  dappSendTransactionRequested: jest.fn(),
  dappSendTransactionSuccess: jest.fn(),
  dappSendTransactionFail: jest.fn(),
};

// Wrapper hook that exposes the atom setter so tests can set currentAccount
function useDappLogicWithSetter(props: Parameters<typeof useDappLogic>[0]) {
  const setAccount = useSetAtom(currentAccountAtomFamily(props.manifest.id));
  const result = useDappLogic(props);
  return { ...result, setAccount };
}

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

// ---- helpers ----

async function renderWithAccount(
  uiHookOverrides: Partial<Parameters<typeof useDappLogic>[0]["uiHook"]> = {},
) {
  const store = createStore();
  const postMessage = jest.fn();

  const uiHook = {
    "account.request": jest.fn(),
    "transaction.sign": jest.fn(),
    "transaction.broadcast": jest.fn(),
    "message.sign": jest.fn(),
    ...uiHookOverrides,
  } as unknown as Parameters<typeof useDappLogic>[0]["uiHook"];

  const { result } = renderHook(
    () =>
      useDappLogicWithSetter({
        manifest: mockManifest as never,
        accounts: [mockAccount],
        postMessage,
        uiHook,
        tracking: mockTracking as never,
      }),
    { wrapper: createWrapper(store) },
  );

  // Set the current account so onDappMessage can proceed past the early returns
  act(() => {
    result.current.setAccount(mockAccount);
  });

  return { result, postMessage, uiHook };
}

describe("useDappLogic — onDappMessage async paths", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Re-establish the default mock return values for this suite.
    const { getEnv } = jest.requireMock("@ledgerhq/live-env");
    getEnv.mockReturnValue(true);
    const { getCryptoAssetsStore } = jest.requireMock("@ledgerhq/cryptoassets/state");
    getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
      findTokenById: jest.fn().mockResolvedValue(null),
    });
  });

  it("personal_sign: awaits prepareMessageToSign and returns signed message", async () => {
    const mockFormattedMessage = { type: "message", message: "deadbeef" };
    const { prepareMessageToSign } = jest.requireMock("../hw/signMessage/index");
    prepareMessageToSign.mockResolvedValue(mockFormattedMessage);

    const messageSignUiHook = jest
      .fn()
      .mockImplementation(({ onSuccess }: { onSuccess: (sig: string) => void }) => {
        onSuccess("0xsignature");
      });

    const { result, postMessage } = await renderWithAccount({
      "message.sign": messageSignUiHook,
    });

    await act(async () => {
      await result.current.onDappMessage({
        jsonrpc: "2.0",
        method: "personal_sign",
        params: ["0xdeadbeef", mockAccount.freshAddress],
        id: 1,
      });
    });

    expect(prepareMessageToSign).toHaveBeenCalledWith(mockAccount, "deadbeef");
    expect(messageSignUiHook).toHaveBeenCalledWith(
      expect.objectContaining({ account: mockAccount, message: mockFormattedMessage }),
    );
    expect(postMessage).toHaveBeenCalledWith(expect.stringContaining('"result":"0xsignature"'));
    expect(mockTracking.dappPersonalSignSuccess).toHaveBeenCalled();
  });

  it("eth_signTypedData: awaits prepareMessageToSign and returns signed typed data", async () => {
    const mockFormattedMessage = { type: "eip712", message: {} };
    const { prepareMessageToSign } = jest.requireMock("../hw/signMessage/index");
    prepareMessageToSign.mockResolvedValue(mockFormattedMessage);

    const messageSignUiHook = jest
      .fn()
      .mockImplementation(({ onSuccess }: { onSuccess: (sig: string) => void }) => {
        onSuccess("0xtypedsig");
      });

    const { result, postMessage } = await renderWithAccount({
      "message.sign": messageSignUiHook,
    });

    const typedMessage = '{"types":{},"domain":{},"message":{}}';

    await act(async () => {
      await result.current.onDappMessage({
        jsonrpc: "2.0",
        method: "eth_signTypedData",
        params: [mockAccount.freshAddress, typedMessage],
        id: 2,
      });
    });

    expect(prepareMessageToSign).toHaveBeenCalledWith(
      mockAccount,
      Buffer.from(typedMessage).toString("hex"),
    );
    expect(postMessage).toHaveBeenCalledWith(expect.stringContaining('"result":"0xtypedsig"'));
    expect(mockTracking.dappSignTypedDataSuccess).toHaveBeenCalled();
  });

  it("eth_sendTransaction: awaits getWalletAPITransactionSignFlowInfos", async () => {
    const { getWalletAPITransactionSignFlowInfos } = jest.requireMock("./converters");
    getWalletAPITransactionSignFlowInfos.mockResolvedValue({
      canEditFees: true,
      hasFeesProvided: false,
      liveTx: { family: "evm", recipient: "0xRECIPIENT", amount: new BigNumber(0) },
    });

    const mockSignedOperation = {
      operation: {
        hash: "0xtxhash",
        id: "op1",
        recipients: [],
        senders: [],
        fee: new BigNumber(0),
        value: new BigNumber(0),
        blockHeight: null,
        blockHash: null,
        transactionSequenceNumber: 0,
        accountId: mockAccount.id,
        type: "OUT" as const,
        date: new Date(),
        extra: {},
      },
      signature: "0xsig",
    };

    const txSignUiHook = jest
      .fn()
      .mockImplementation(
        ({ onSuccess }: { onSuccess: (op: typeof mockSignedOperation) => void }) => {
          onSuccess(mockSignedOperation);
        },
      );

    const { result, postMessage } = await renderWithAccount({
      "transaction.sign": txSignUiHook,
      "transaction.broadcast": jest.fn(),
    });

    await act(async () => {
      await result.current.onDappMessage({
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [
          {
            from: mockAccount.freshAddress,
            to: "0xRECIPIENT",
            value: "0x0",
          },
        ],
        id: 3,
      });
    });

    expect(getWalletAPITransactionSignFlowInfos).toHaveBeenCalled();
    expect(txSignUiHook).toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(expect.stringContaining('"result":"0xtxhash"'));
    expect(mockTracking.dappSendTransactionSuccess).toHaveBeenCalled();
  });
});
