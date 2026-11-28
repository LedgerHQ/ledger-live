import React from "react";
import { act, render } from "@testing-library/react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { UiHook } from "@ledgerhq/live-common/wallet-api/react";
import { app } from "~/renderer/bridge";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { useWebviewState } from "./helpers";
import type { WebviewBridgeMessage } from "~/bridge/contract";

let mockUiHook: Partial<UiHook> = {};
const mockDispatch = jest.fn();
const mockOnDappMessage = jest.fn();
const mockOnLoad = jest.fn();
let mockNoAccounts = false;
const mockSession = { isOpen: true, send: jest.fn(), receive: jest.fn(), deliver: jest.fn() };
const mockAccept = jest.fn();
let mockOnBridgeMessage: ((message: WebviewBridgeMessage) => void) | undefined;
let mockOnCloseSessionUi: (() => void) | undefined;
let mockFeatureFlags: Record<string, unknown> = {};
const mockPrepareSignTransaction = jest.fn(
  (_account: unknown, _parent: unknown, liveTx: Record<string, unknown>) =>
    Promise.resolve({ family: "ethereum", ...liveTx }),
);

jest.mock("@ledgerhq/live-common/wallet-api/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/logic"),
  prepareSignTransaction: (
    account: unknown,
    parentAccount: unknown,
    liveTx: Record<string, unknown>,
  ) => mockPrepareSignTransaction(account, parentAccount, liveTx),
}));

let capturedTxOnClose: Array<() => void> = [];
let capturedMsgOnClose: Array<() => void> = [];

type MockTxDialogProps = Readonly<{
  request: { transaction: { recipient?: string } };
  onClose: () => void;
}>;
type MockMsgDialogProps = Readonly<{
  request: { message: { message: string } };
  onClose: () => void;
}>;

jest.mock("LLD/features/WalletApiSignature/components/TransactionSignatureDialog", () => ({
  TransactionSignatureDialog: ({ request, onClose }: MockTxDialogProps) => {
    capturedTxOnClose.push(onClose);
    return (
      <button type="button" data-testid="tx-signature-dialog" onClick={onClose}>
        {request.transaction.recipient}
      </button>
    );
  },
}));

jest.mock("LLD/features/WalletApiSignature/components/MessageSignatureDialog", () => ({
  MessageSignatureDialog: ({ request, onClose }: MockMsgDialogProps) => {
    capturedMsgOnClose.push(onClose);
    return (
      <button type="button" data-testid="msg-signature-dialog" onClick={onClose}>
        {request.message.message}
      </button>
    );
  },
}));

jest.mock("@ledgerhq/live-common/wallet-api/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/react"),
  useConfig: jest.fn(() => ({})),
  useWalletAPIServer: jest.fn(({ uiHook }: { uiHook: Partial<UiHook> }) => {
    mockUiHook = uiHook;
    return {
      widgetLoaded: true,
      onLoad: mockOnLoad,
      onReload: jest.fn(),
      onMessage: jest.fn(),
      server: undefined,
    };
  }),
}));

jest.mock("@ledgerhq/live-common/wallet-api/useDappLogic", () => ({
  useDappLogic: () => ({
    onDappMessage: mockOnDappMessage,
    noAccounts: mockNoAccounts,
    isLoadingAccounts: false,
  }),
}));

jest.mock("./bridge", () => ({
  useWebviewBridgeSession: (_ref: unknown, _url: unknown, onCloseSessionUi?: () => void) => {
    mockOnCloseSessionUi = onCloseSessionUi;
    return {
      session: mockSession,
      accept: mockAccept,
      onMainFrameNavigation: jest.fn(),
    };
  },
  useWebviewBridgeMessages: (_ref: unknown, onBridgeMessage: (m: WebviewBridgeMessage) => void) => {
    mockOnBridgeMessage = onBridgeMessage;
  },
}));

jest.mock("./DappAccountGate", () => ({
  DappAccountGate: () => null,
}));

jest.mock("@ledgerhq/live-common/wallet-api/ModularDrawer/useDrawerConfiguration", () => ({
  useDrawerConfiguration: () => ({ createDrawerConfiguration: jest.fn() }),
}));

jest.mock("@ledgerhq/live-common/notifications/ToastProvider/index", () => ({
  useToasts: () => ({ pushToast: jest.fn() }),
}));

jest.mock("./helpers", () => ({
  useWebviewState: jest.fn(),
  getAttachedWebview: jest.fn(),
}));

jest.mock("LLD/hooks/redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock("@domain/entity-client-identity", () => ({
  userIdSelector: () => ({ exportUserIdForWalletAPI: () => "user-id" }),
}));

jest.mock("~/renderer/reducers/accounts", () => ({
  ...jest.requireActual("~/renderer/reducers/accounts"),
  flattenAccountsSelector: () => [],
}));

jest.mock("~/renderer/reducers/settings", () => ({
  ...jest.requireActual("~/renderer/reducers/settings"),
  mevProtectionSelector: () => false,
  shareAnalyticsSelector: () => false,
}));

jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  walletSelector: () => ({ accountNames: new Map() }),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: (flagId: string) => mockFeatureFlags[flagId] ?? null,
}));

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetAndAccount", () => ({
  useOpenAssetAndAccount: () => ({ openAssetAndAccount: jest.fn() }),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

const manifest: LiveAppManifest = {
  id: "test-app",
  name: "Test App",
  private: false,
  url: "https://example.com",
  homepageUrl: "https://example.com",
  icon: "",
  platforms: ["desktop"],
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: [],
  currencies: "*",
  content: { shortDescription: { en: "Test" }, description: { en: "Test" } },
  permissions: [],
  domains: ["https://example.com"],
  visibility: "complete",
};

type Handler = (...args: unknown[]) => void;
const callbacks = { onSuccess: jest.fn(), onError: jest.fn(), onCancel: jest.fn() };

describe("WalletAPIWebview UI hooks", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "api", {
      value: { appDirname: "/fake/path" },
      writable: true,
    });
  });

  beforeEach(() => {
    jest.mocked(useWebviewState).mockReturnValue({
      webviewState: { loading: false, isAppUnavailable: false },
      webviewRef: { current: null },
      setWebviewRef: jest.fn(),
      webviewProps: {},
      webviewPartition: {},
      handleRefresh: jest.fn(),
    } as never);
    render(<WalletAPIWebview manifest={manifest} />);
  });

  it.each([
    "account.request",
    "account.receive",
    "account.publicKeyUnavailable",
    "message.sign",
    "transaction.sign",
    "transaction.signRaw",
    "device.transport",
    "device.select",
    "exchange.start",
    "exchange.complete",
  ] as const)("%s should bring the window to the front", name => {
    const handler = mockUiHook[name] as Handler;

    handler({ ...callbacks, transaction: {}, exchangeParams: {}, signFlowInfos: {} });

    expect(app.show).toHaveBeenCalledTimes(1);
  });

  it.each(["storage.get", "storage.set"] as const)(
    "%s should not bring the window to the front",
    name => {
      const handler = mockUiHook[name] as Handler;

      handler({ key: "key", value: "value", storeId: "store" });

      expect(app.show).not.toHaveBeenCalled();
    },
  );
});

describe("WalletAPIWebview bridge messages", () => {
  const sendBridgeMessage = (message: Partial<WebviewBridgeMessage>) =>
    mockOnBridgeMessage?.({
      guestId: 1,
      origin: "https://example.com",
      channel: "webviewToParent",
      message: "{}",
      ...message,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccept.mockReturnValue(mockSession);
    mockSession.deliver.mockImplementation((handle: () => void) => handle());
    jest.mocked(useWebviewState).mockReturnValue({
      webviewState: { loading: false, isAppUnavailable: false, url: "https://example.com" },
      webviewRef: { current: null },
      setWebviewRef: jest.fn(),
      webviewProps: {},
      webviewPartition: {},
      handleRefresh: jest.fn(),
    } as never);
    render(<WalletAPIWebview manifest={manifest} />);
  });

  it("hands Wallet API messages to the session of their origin", () => {
    sendBridgeMessage({ message: '{"id":1}' });

    expect(mockAccept).toHaveBeenCalledWith("https://example.com");
    expect(mockSession.receive).toHaveBeenCalledWith('{"id":1}');
    expect(mockOnDappMessage).not.toHaveBeenCalled();
  });

  it("hands dapp messages to the dapp logic through the session", () => {
    const request = { jsonrpc: "2.0", id: 1, method: "eth_chainId" };

    sendBridgeMessage({ channel: "dappToParent", message: request });

    expect(mockSession.deliver).toHaveBeenCalled();
    expect(mockOnDappMessage).toHaveBeenCalledWith(request);
    expect(mockSession.receive).not.toHaveBeenCalled();
  });

  it("drops messages that the session does not accept", () => {
    mockAccept.mockReturnValue(undefined);

    sendBridgeMessage({ origin: "https://other.example.com" });
    sendBridgeMessage({ channel: "dappToParent", message: { jsonrpc: "2.0" } });

    expect(mockSession.receive).not.toHaveBeenCalled();
    expect(mockOnDappMessage).not.toHaveBeenCalled();
  });

  it("drops malformed payloads", () => {
    sendBridgeMessage({ message: { not: "a string" } });
    sendBridgeMessage({ channel: "dappToParent", message: "not an object" });

    expect(mockSession.receive).not.toHaveBeenCalled();
    expect(mockOnDappMessage).not.toHaveBeenCalled();
  });
});

describe("WalletAPIWebview load", () => {
  it("listens to the webview load once the dapp account gate opens", () => {
    const webviewRef: { current: HTMLElement | null } = { current: null };
    jest.mocked(useWebviewState).mockReturnValue({
      webviewState: { loading: false, isAppUnavailable: false },
      webviewRef,
      setWebviewRef: (node: HTMLElement | null) => {
        webviewRef.current = node;
      },
      webviewProps: {},
      webviewPartition: {},
      handleRefresh: jest.fn(),
    } as never);
    const dappManifest = { ...manifest, dapp: { networks: [], provider: "evm" } } as never;
    mockNoAccounts = true;
    const { rerender } = render(
      <WalletAPIWebview manifest={dappManifest} setCurrentAccountHistDb={jest.fn()} />,
    );
    expect(webviewRef.current).toBeNull();

    mockNoAccounts = false;
    rerender(<WalletAPIWebview manifest={dappManifest} setCurrentAccountHistDb={jest.fn()} />);
    act(() => {
      webviewRef.current?.dispatchEvent(new Event("did-finish-load"));
    });

    expect(mockOnLoad).toHaveBeenCalledTimes(1);
  });
});

describe("WalletAPIWebview Device Intent sign routing", () => {
  const activeDeviceIntentSignFlag = {
    lldWalletApiDeviceIntentSign: {
      enabled: true,
      params: { variantId: "variant_a", enabledManifestIds: [manifest.id] },
    },
  };

  function requestTransactionSign(handlers: object, recipient: string) {
    return (mockUiHook["transaction.sign"] as Handler)({
      ...handlers,
      account: { id: "acc-1", type: "Account" },
      signFlowInfos: { canEditFees: false, hasFeesProvided: true, liveTx: { recipient } },
    });
  }

  function requestMessageSign(handlers: object, message: string) {
    return (mockUiHook["message.sign"] as Handler)({
      ...handlers,
      account: { id: "acc-1", type: "Account" },
      message: { message },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlags = {};
    mockSession.isOpen = true;
    capturedTxOnClose = [];
    capturedMsgOnClose = [];
    jest.mocked(useWebviewState).mockReturnValue({
      webviewState: { loading: false, isAppUnavailable: false, url: "https://example.com" },
      webviewRef: { current: null },
      setWebviewRef: jest.fn(),
      webviewProps: {},
      webviewPartition: {},
      handleRefresh: jest.fn(),
    } as never);
  });

  it("opens Redux modals when lldWalletApiDeviceIntentSign is inactive", () => {
    const { queryByTestId } = render(<WalletAPIWebview manifest={manifest} />);

    (mockUiHook["message.sign"] as Handler)({
      ...callbacks,
      account: { id: "acc-1", type: "Account" },
      message: { message: "hi" },
    });
    (mockUiHook["transaction.sign"] as Handler)({
      ...callbacks,
      account: { id: "acc-1", type: "Account" },
      signFlowInfos: { canEditFees: false, hasFeesProvided: true, liveTx: {} },
    });

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(queryByTestId("msg-signature-dialog")).toBeNull();
    expect(queryByTestId("tx-signature-dialog")).toBeNull();
  });

  it("shows one sign dialog at a time, first in first out, and clears them on session reset", async () => {
    mockFeatureFlags = activeDeviceIntentSignFlag;
    const { getByTestId, queryByTestId } = render(<WalletAPIWebview manifest={manifest} />);

    await act(async () => {
      requestMessageSign(callbacks, "hi");
      await requestTransactionSign(callbacks, "0xabc");
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockPrepareSignTransaction).toHaveBeenCalledTimes(1);
    expect(getByTestId("msg-signature-dialog")).toHaveTextContent("hi");
    expect(queryByTestId("tx-signature-dialog")).toBeNull();

    act(() => capturedMsgOnClose.at(-1)?.());

    expect(queryByTestId("msg-signature-dialog")).toBeNull();
    expect(getByTestId("tx-signature-dialog")).toHaveTextContent("0xabc");

    act(() => {
      mockOnCloseSessionUi?.();
    });

    expect(queryByTestId("msg-signature-dialog")).toBeNull();
    expect(queryByTestId("tx-signature-dialog")).toBeNull();
  });

  it("does not mount TransactionSignatureDialog if session closed while preparing transaction", async () => {
    mockFeatureFlags = {
      lldWalletApiDeviceIntentSign: {
        enabled: true,
        params: { variantId: "variant_a", enabledManifestIds: [manifest.id] },
      },
    };
    mockPrepareSignTransaction.mockImplementationOnce(async () => {
      mockSession.isOpen = false;
      return { family: "ethereum" };
    });

    const { queryByTestId } = render(<WalletAPIWebview manifest={manifest} />);

    await act(async () => {
      await (mockUiHook["transaction.sign"] as Handler)({
        ...callbacks,
        account: { id: "acc-1", type: "Account" },
        signFlowInfos: { canEditFees: false, hasFeesProvided: true, liveTx: {} },
      });
    });

    expect(queryByTestId("tx-signature-dialog")).toBeNull();
  });

  it("queues a second transaction.sign without settling the first", async () => {
    mockFeatureFlags = activeDeviceIntentSignFlag;
    const { getByTestId } = render(<WalletAPIWebview manifest={manifest} />);
    const first = { onSuccess: jest.fn(), onError: jest.fn() };
    const second = { onSuccess: jest.fn(), onError: jest.fn() };

    await act(async () => {
      await requestTransactionSign(first, "0xfirst");
      await requestTransactionSign(second, "0xsecond");
    });

    expect(first.onError).not.toHaveBeenCalled();
    expect(second.onError).not.toHaveBeenCalled();
    expect(getByTestId("tx-signature-dialog")).toHaveTextContent("0xfirst");

    act(() => capturedTxOnClose.at(-1)?.());

    expect(getByTestId("tx-signature-dialog")).toHaveTextContent("0xsecond");
  });

  it("queues a message.sign sent during a transaction.sign without cancelling either", async () => {
    mockFeatureFlags = activeDeviceIntentSignFlag;
    const { getByTestId, queryByTestId } = render(<WalletAPIWebview manifest={manifest} />);
    const transaction = { onSuccess: jest.fn(), onError: jest.fn() };
    const message = { onSuccess: jest.fn(), onError: jest.fn(), onCancel: jest.fn() };

    await act(async () => {
      await requestTransactionSign(transaction, "0xabc");
      requestMessageSign(message, "hello");
    });

    expect(transaction.onError).not.toHaveBeenCalled();
    expect(message.onCancel).not.toHaveBeenCalled();
    expect(getByTestId("tx-signature-dialog")).toBeVisible();
    expect(queryByTestId("msg-signature-dialog")).toBeNull();

    act(() => capturedTxOnClose.at(-1)?.());

    expect(queryByTestId("tx-signature-dialog")).toBeNull();
    expect(getByTestId("msg-signature-dialog")).toHaveTextContent("hello");
  });

  it("does not drop the next request when a settled dialog closes again", async () => {
    mockFeatureFlags = activeDeviceIntentSignFlag;
    const { getByTestId, queryByTestId } = render(<WalletAPIWebview manifest={manifest} />);

    await act(async () => {
      await requestTransactionSign(callbacks, "0xfirst");
      await requestTransactionSign(callbacks, "0xsecond");
    });
    const firstOnClose = capturedTxOnClose.at(-1);

    act(() => firstOnClose?.());
    const secondOnClose = capturedTxOnClose.at(-1);
    act(() => firstOnClose?.());

    expect(getByTestId("tx-signature-dialog")).toHaveTextContent("0xsecond");

    act(() => secondOnClose?.());

    expect(queryByTestId("tx-signature-dialog")).toBeNull();
  });
});
