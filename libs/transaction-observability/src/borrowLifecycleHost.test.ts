import { setBorrowManifestIdReader, isBorrowApp } from "./borrowApps";
import { ErrorCategory } from "./errorCategory";
import {
  installBorrowLifecycleHost,
  setBorrowTxLifecycleBaseUrl,
  setBorrowTxLifecycleFlagReader,
  startBorrowLifecycleMonitoring,
} from "./borrowLifecycleHost";
import { setEarnTxLifecycleFlagReader, setTxLifecycleBaseUrl } from "./earnLifecycleHost";
import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "./logEvent";
import { emitTransactionEvent, resetTransactionObservers } from "./observer";
import { clearPendingTxLifecycle } from "./txLifecycle";
import { registerTxLifecycleObserver, toTxLifecyclePayload } from "./txLifecycleProducts";

const common = {
  appVersion: "lld/2.0.0",
  pathway: TransactionPathway.WalletApiSignAndBroadcast,
  manifestId: "borrow",
  currencyId: "ethereum",
  family: "evm",
  currencyTicker: "ETH",
  isTestnet: false,
  isSendMax: false,
  dataSource: TransactionDataSource.Sign,
  rawTransactionType: "contract",
};

const intent: LogEvent = { status: "intent", stage: TransactionStage.Sign, ...common };
const success: LogEvent = { status: "success", stage: TransactionStage.Broadcast, ...common };

describe("borrow lifecycle", () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  const calls = () =>
    fetchSpy.mock.calls.map(([url, init]) => ({
      url: String(url),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    }));

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    setBorrowTxLifecycleBaseUrl("https://borrow.example.test/");
    setTxLifecycleBaseUrl("https://earn.example.test");
    setBorrowTxLifecycleFlagReader(() => true);
    setEarnTxLifecycleFlagReader(() => true);
    registerTxLifecycleObserver("desktop");
  });

  afterEach(() => {
    resetTransactionObservers();
    clearPendingTxLifecycle("desktop", "borrow");
    clearPendingTxLifecycle("desktop", "earn");
    setBorrowTxLifecycleFlagReader(null);
    setEarnTxLifecycleFlagReader(null);
    setBorrowManifestIdReader(null);
    setBorrowTxLifecycleBaseUrl(undefined);
    setTxLifecycleBaseUrl(undefined);
    fetchSpy.mockRestore();
  });

  it("recognises the default manifest and the one the flag configures", () => {
    expect(isBorrowApp("borrow")).toBe(true);
    expect(isBorrowApp("borrow-stg")).toBe(false);
    setBorrowManifestIdReader(() => "borrow-stg");
    expect(isBorrowApp("borrow-stg")).toBe(true);
    expect(isBorrowApp(undefined)).toBe(false);
    expect(isBorrowApp("lido")).toBe(false);
  });

  it("maps a borrow sign intent onto the dapp path", () => {
    expect(toTxLifecyclePayload(intent, "desktop")).toMatchObject({
      event: "tx_intent",
      path: "dapp",
      currency_family: "ethereum",
    });
  });

  it("leaves intent and success to the live app", () => {
    emitTransactionEvent(intent);
    emitTransactionEvent(success);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports an attempt abandoned with the webview to the Borrow sink only", () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();

    expect(calls()).toEqual([
      {
        url: "https://borrow.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({
          event: "tx_terminal",
          outcome: "failure",
          failure_class: "abandoned",
          path: "dapp",
        }),
      },
    ]);
  });

  it("does not report anything when the webview closes with no attempt pending", () => {
    startBorrowLifecycleMonitoring("desktop", "borrow", true)?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not report an attempt that already ended", () => {
    emitTransactionEvent(intent);
    emitTransactionEvent(success);
    startBorrowLifecycleMonitoring("desktop", "borrow", true)?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("answers to its own kill-switch, not Earn's", () => {
    setEarnTxLifecycleFlagReader(() => false);
    let close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();
    expect(calls()).toEqual([
      expect.objectContaining({ url: "https://borrow.example.test/v1/tx/lifecycle" }),
    ]);

    fetchSpy.mockClear();
    setBorrowTxLifecycleFlagReader(() => false);
    setEarnTxLifecycleFlagReader(() => true);
    close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("drops the pending attempt when the flag is off at mount", () => {
    emitTransactionEvent(intent);
    expect(startBorrowLifecycleMonitoring("desktop", "borrow", false)).toBeUndefined();
    setBorrowTxLifecycleFlagReader(() => true);
    startBorrowLifecycleMonitoring("desktop", "borrow", true)?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps a Borrow kill-switch from clearing Earn attempts", () => {
    const earnIntent: LogEvent = {
      ...intent,
      manifestId: "lido",
      earnTransactionType: "delegate",
    };
    emitTransactionEvent(earnIntent);
    setBorrowTxLifecycleFlagReader(() => false);
    emitTransactionEvent(intent);
    fetchSpy.mockClear();

    emitTransactionEvent({ ...success, manifestId: "lido" });
    expect(calls()).toEqual([
      expect.objectContaining({ url: "https://earn.example.test/v1/tx/lifecycle" }),
    ]);
  });

  it("clears pending attempts when the kill-switch turns off at runtime", () => {
    let enabled = true;
    const listener = installBorrowLifecycleHost({
      platform: "desktop",
      readEnabled: () => enabled,
      readManifestId: () => "borrow-stg",
      apiBaseUrl: "https://borrow.example.test",
    });
    emitTransactionEvent({ ...intent, manifestId: "borrow-stg" });

    enabled = false;
    listener();
    enabled = true;
    startBorrowLifecycleMonitoring("desktop", "borrow-stg", true)?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not report an attempt left pending before the screen mounted", () => {
    emitTransactionEvent(intent);
    startBorrowLifecycleMonitoring("desktop", "borrow", true)?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports a sign flow abandoned mid-way once, then nothing at teardown", () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    emitTransactionEvent({
      status: "failure",
      stage: TransactionStage.Sign,
      error: new Error("dismissed"),
      errorCategory: ErrorCategory.UserModalDismissed,
      abandoned: true,
      ...common,
    });
    close?.();

    expect(calls()).toEqual([
      expect.objectContaining({
        url: "https://borrow.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned" }),
      }),
    ]);
  });

  it("leaves a device refusal to the live app and closes the attempt", () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    emitTransactionEvent({
      status: "failure",
      stage: TransactionStage.Sign,
      error: new Error("refused"),
      errorCategory: ErrorCategory.UserDeviceRefused,
      ...common,
    });
    close?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports a superseded attempt on another chain once, to the Borrow sink", () => {
    startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    emitTransactionEvent({ ...intent, currencyId: "polygon" });

    expect(calls()).toEqual([
      {
        url: "https://borrow.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned", network: "ethereum" }),
      },
    ]);
  });

  it("drops a manifest both products claim rather than misroute it", () => {
    setBorrowManifestIdReader(() => "lido");
    const lidoIntent: LogEvent = { ...intent, manifestId: "lido", earnTransactionType: "delegate" };

    expect(toTxLifecyclePayload(lidoIntent, "desktop")).toBeNull();
    emitTransactionEvent(lidoIntent);
    emitTransactionEvent({ ...success, manifestId: "lido" });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
