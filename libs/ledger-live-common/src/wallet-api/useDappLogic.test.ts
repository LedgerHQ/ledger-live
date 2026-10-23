/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider, createStore, useSetAtom } from "jotai";
import BigNumber from "bignumber.js";
import { currentAccountAtomFamily, useDappLogic } from "./useDappLogic";
import { AppBranch, AppPlatform, Visibility } from "./types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { BridgeSession } from "./bridgeSession";

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

jest.mock("@shared/env", () => ({
  getEnv: jest.fn().mockReturnValue(true),
  changes: { subscribe: jest.fn() },
}));

jest.mock("@ledgerhq/live-network/network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/coin-evm/logic-public", () => ({
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

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn().mockReturnValue({
    findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
    findTokenById: jest.fn().mockResolvedValue(null),
  }),
}));

// ---- shared test fixtures ----

const mockCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: CryptoCurrencyIdSchema.parse("ethereum"),
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
  session?: BridgeSession,
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
        session,
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
    const { getEnv } = jest.requireMock("@shared/env");
    getEnv.mockReturnValue(true);
    const { getCryptoAssetsStore } = jest.requireMock(
      "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore",
    );
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

describe("useDappLogic — liveBlindSigningReporter live-app context", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const { getEnv } = jest.requireMock("@shared/env");
    getEnv.mockReturnValue(true);
    const { getCryptoAssetsStore } = jest.requireMock(
      "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore",
    );
    getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
      findTokenById: jest.fn().mockResolvedValue(null),
    });
    liveBlindSigningReporter.setContext({ liveAppContext: null });
  });

  it("eth_sendTransaction: tags the active sign call with manifest.id and clears it after", async () => {
    const { getWalletAPITransactionSignFlowInfos } = jest.requireMock("./converters");
    getWalletAPITransactionSignFlowInfos.mockResolvedValue({
      canEditFees: true,
      hasFeesProvided: false,
      liveTx: { family: "evm", recipient: "0xRECIPIENT", amount: new BigNumber(0) },
    });

    let contextDuringSign: string | null | undefined = "not-called";
    const txSignUiHook = jest.fn().mockImplementation(({ onSuccess }) => {
      contextDuringSign = liveBlindSigningReporter.getContext().liveAppContext;
      onSuccess({
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
      });
    });

    const { result } = await renderWithAccount({
      "transaction.sign": txSignUiHook,
      "transaction.broadcast": jest.fn(),
    });

    await act(async () => {
      await result.current.onDappMessage({
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [{ from: mockAccount.freshAddress, to: "0xRECIPIENT", value: "0x0" }],
        id: 1,
      });
    });

    expect(contextDuringSign).toBe(mockManifest.id);
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });

  it("personal_sign: tags the active sign call with manifest.id and clears it after", async () => {
    const { prepareMessageToSign } = jest.requireMock("../hw/signMessage/index");
    prepareMessageToSign.mockResolvedValue({ type: "message", message: "deadbeef" });

    let contextDuringSign: string | null | undefined = "not-called";
    const messageSignUiHook = jest.fn().mockImplementation(({ onSuccess }) => {
      contextDuringSign = liveBlindSigningReporter.getContext().liveAppContext;
      onSuccess("0xsignature");
    });

    const { result } = await renderWithAccount({ "message.sign": messageSignUiHook });

    await act(async () => {
      await result.current.onDappMessage({
        jsonrpc: "2.0",
        method: "personal_sign",
        params: ["0xdeadbeef", mockAccount.freshAddress],
        id: 2,
      });
    });

    expect(contextDuringSign).toBe(mockManifest.id);
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });

  it("eth_signTypedData: tags the active sign call with manifest.id and clears it after", async () => {
    const { prepareMessageToSign } = jest.requireMock("../hw/signMessage/index");
    prepareMessageToSign.mockResolvedValue({ type: "eip712", message: {} });

    let contextDuringSign: string | null | undefined = "not-called";
    const messageSignUiHook = jest.fn().mockImplementation(({ onSuccess }) => {
      contextDuringSign = liveBlindSigningReporter.getContext().liveAppContext;
      onSuccess("0xtypedsig");
    });

    const { result } = await renderWithAccount({ "message.sign": messageSignUiHook });

    await act(async () => {
      await result.current.onDappMessage({
        jsonrpc: "2.0",
        method: "eth_signTypedData",
        params: [mockAccount.freshAddress, '{"types":{},"domain":{},"message":{}}'],
        id: 3,
      });
    });

    expect(contextDuringSign).toBe(mockManifest.id);
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });

  it("clears the live-app context even when the user rejects an eth_sendTransaction", async () => {
    const { getWalletAPITransactionSignFlowInfos } = jest.requireMock("./converters");
    getWalletAPITransactionSignFlowInfos.mockResolvedValue({
      canEditFees: true,
      hasFeesProvided: false,
      liveTx: { family: "evm", recipient: "0xRECIPIENT", amount: new BigNumber(0) },
    });

    const txSignUiHook = jest.fn().mockImplementation(({ onError }) => {
      onError(new Error("user rejected"));
    });

    const { result } = await renderWithAccount({
      "transaction.sign": txSignUiHook,
      "transaction.broadcast": jest.fn(),
    });

    await act(async () => {
      await result.current.onDappMessage({
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [{ from: mockAccount.freshAddress, to: "0xRECIPIENT", value: "0x0" }],
        id: 4,
      });
    });

    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });
});

describe("useDappLogic — requests of a closed bridge session", () => {
  const signedOperation = {
    operation: {
      hash: "0xtxhash",
      id: "op1",
      recipients: [],
      senders: [],
      fee: new BigNumber(0),
      value: new BigNumber(0),
      blockHeight: null,
      blockHash: null,
      transactionSequenceNumber: new BigNumber(0),
      accountId: mockAccount.id,
      type: "OUT" as const,
      date: new Date(),
      extra: {},
    },
    signature: "0xsig",
  };

  const sendTransaction = {
    jsonrpc: "2.0" as const,
    method: "eth_sendTransaction",
    params: [{ from: mockAccount.freshAddress, to: "0xRECIPIENT", value: "0x0" }],
    id: 1,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    const { getCryptoAssetsStore } = jest.requireMock(
      "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore",
    );
    getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
      findTokenById: jest.fn().mockResolvedValue(null),
    });
    const { getWalletAPITransactionSignFlowInfos } = jest.requireMock("./converters");
    getWalletAPITransactionSignFlowInfos.mockResolvedValue({
      canEditFees: true,
      hasFeesProvided: false,
      liveTx: { family: "evm", recipient: "0xRECIPIENT", amount: new BigNumber(0) },
    });
    const { prepareMessageToSign } = jest.requireMock("../hw/signMessage/index");
    prepareMessageToSign.mockResolvedValue({ type: "message", message: "deadbeef" });
    liveBlindSigningReporter.setContext({ liveAppContext: null });
  });

  it.each([
    ["personal_sign", ["0xdeadbeef", mockAccount.freshAddress]],
    ["eth_signTypedData", [mockAccount.freshAddress, '{"types":{},"domain":{},"message":{}}']],
  ])(
    "%s: rejects when the session closes while the signing flow is open, restoring the attribution",
    async (method, params) => {
      const session = new BridgeSession("https://a.com", jest.fn());
      const { result, postMessage } = await renderWithAccount(
        { "message.sign": jest.fn() }, // never answers: the flow stays open
        session,
      );

      let request: Promise<void> = Promise.resolve();
      act(() => {
        request = result.current.onDappMessage({ jsonrpc: "2.0", method, params, id: 1 });
      });
      await waitFor(() =>
        expect(liveBlindSigningReporter.getContext().liveAppContext).toBe(mockManifest.id),
      );

      act(() => session.close());
      await act(async () => {
        await request;
      });

      expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
      expect(postMessage).toHaveBeenCalledWith(expect.stringContaining('"error"'));
    },
  );

  it("eth_sendTransaction: rejects when the session closes while the signing flow is open", async () => {
    const session = new BridgeSession("https://a.com", jest.fn());
    const { result } = await renderWithAccount({ "transaction.sign": jest.fn() }, session);

    let request: Promise<void> = Promise.resolve();
    act(() => {
      request = result.current.onDappMessage(sendTransaction);
    });
    await waitFor(() =>
      expect(liveBlindSigningReporter.getContext().liveAppContext).toBe(mockManifest.id),
    );

    act(() => session.close());
    await act(async () => {
      await request;
    });

    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
    expect(mockTracking.dappSendTransactionFail).toHaveBeenCalled();
  });

  it("eth_sendTransaction: does not broadcast a transaction signed for a session closed meanwhile", async () => {
    const { getEnv } = jest.requireMock("@shared/env");
    getEnv.mockReturnValue(false);
    const broadcast = jest.fn().mockResolvedValue(signedOperation.operation);
    const { getAccountBridge } = jest.requireMock("../bridge");
    const session = new BridgeSession("https://a.com", jest.fn());
    // The origin changes while the account bridge is prepared.
    getAccountBridge.mockImplementation(async () => {
      session.close();
      return { broadcast };
    });
    const transactionBroadcast = jest.fn();
    const { result, postMessage } = await renderWithAccount(
      {
        "transaction.sign": jest.fn(({ onSuccess }) => onSuccess(signedOperation)),
        "transaction.broadcast": transactionBroadcast,
      },
      session,
    );

    await act(async () => {
      await result.current.onDappMessage(sendTransaction);
    });

    expect(broadcast).not.toHaveBeenCalled();
    expect(transactionBroadcast).not.toHaveBeenCalled();
    expect(mockTracking.dappSendTransactionFail).toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalledWith(expect.stringContaining('"result"'));
  });

  it("eth_sendTransaction: broadcasts while the session is open", async () => {
    const { getEnv } = jest.requireMock("@shared/env");
    getEnv.mockReturnValue(false);
    const broadcast = jest.fn().mockResolvedValue(signedOperation.operation);
    const { getAccountBridge } = jest.requireMock("../bridge");
    getAccountBridge.mockResolvedValue({ broadcast });
    const { result } = await renderWithAccount(
      {
        "transaction.sign": jest.fn(({ onSuccess }) => onSuccess(signedOperation)),
        "transaction.broadcast": jest.fn(),
      },
      new BridgeSession("https://a.com", jest.fn()),
    );

    await act(async () => {
      await result.current.onDappMessage(sendTransaction);
    });

    expect(broadcast).toHaveBeenCalledTimes(1);
  });
});
