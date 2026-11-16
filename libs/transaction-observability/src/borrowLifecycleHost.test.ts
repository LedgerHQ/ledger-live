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
import { listenToTxLifecycle } from "./txLifecycleEndpoint.mock";
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
  const lifecycle = listenToTxLifecycle();

  beforeEach(() => {
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
  });

  it("recognises the default manifest and the one the flag configures", async () => {
    expect(isBorrowApp("borrow")).toBe(true);
    expect(isBorrowApp("borrow-stg")).toBe(false);
    setBorrowManifestIdReader(() => "borrow-stg");
    expect(isBorrowApp("borrow-stg")).toBe(true);
    expect(isBorrowApp(undefined)).toBe(false);
    expect(isBorrowApp("lido")).toBe(false);
  });

  it("maps a borrow sign intent onto the dapp path", async () => {
    expect(toTxLifecyclePayload(intent, "desktop")).toMatchObject({
      event: "tx_intent",
      path: "dapp",
      currency_family: "ethereum",
    });
  });

  it("leaves intent and success to the live app", async () => {
    emitTransactionEvent(intent);
    emitTransactionEvent(success);

    expect(await lifecycle.received()).toEqual([]);
  });

  it("reports an attempt abandoned with the webview to the Borrow sink only", async () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();

    expect(await lifecycle.received()).toEqual([
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

  it("does not report anything when the webview closes with no attempt pending", async () => {
    startBorrowLifecycleMonitoring("desktop", "borrow", true)?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("does not report an attempt that already ended", async () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    emitTransactionEvent(success);
    close?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("answers to its own kill-switch, not Earn's", async () => {
    setEarnTxLifecycleFlagReader(() => false);
    let close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();
    expect(await lifecycle.received()).toEqual([
      expect.objectContaining({ url: "https://borrow.example.test/v1/tx/lifecycle" }),
    ]);

    await lifecycle.forget();
    setBorrowTxLifecycleFlagReader(() => false);
    setEarnTxLifecycleFlagReader(() => true);
    close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();
    expect(await lifecycle.received()).toEqual([]);
  });

  it("drops the pending attempt when the flag is off at mount", async () => {
    emitTransactionEvent(intent);
    expect(startBorrowLifecycleMonitoring("desktop", "borrow", false)).toBeUndefined();
    setBorrowTxLifecycleFlagReader(() => true);
    startBorrowLifecycleMonitoring("desktop", "borrow", true)?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("keeps a Borrow kill-switch from clearing Earn attempts", async () => {
    const earnIntent: LogEvent = {
      ...intent,
      manifestId: "lido",
      earnTransactionType: "delegate",
    };
    emitTransactionEvent(earnIntent);
    setBorrowTxLifecycleFlagReader(() => false);
    emitTransactionEvent(intent);
    await lifecycle.forget();

    emitTransactionEvent({ ...success, manifestId: "lido" });
    expect(await lifecycle.received()).toEqual([
      expect.objectContaining({ url: "https://earn.example.test/v1/tx/lifecycle" }),
    ]);
  });

  it("clears pending attempts when the kill-switch turns off at runtime", async () => {
    let enabled = true;
    const listener = installBorrowLifecycleHost({
      platform: "desktop",
      readEnabled: () => enabled,
      readManifestId: () => "borrow-stg",
      apiBaseUrl: "https://borrow.example.test",
    });
    const close = startBorrowLifecycleMonitoring("desktop", "borrow-stg", true);
    emitTransactionEvent({ ...intent, manifestId: "borrow-stg" });

    enabled = false;
    listener();
    enabled = true;
    close?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("does not report an attempt left pending before the screen mounted", async () => {
    emitTransactionEvent(intent);
    startBorrowLifecycleMonitoring("desktop", "borrow", true)?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("posts an attempt still pending when the Borrow screen goes away, once", async () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();
    close?.();

    expect(await lifecycle.received()).toEqual([
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

  it("leaves a closed sign modal to the live app, which reports it as a cancel", async () => {
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

    expect(await lifecycle.received()).toEqual([]);
  });

  it("leaves a device refusal to the live app and closes the attempt", async () => {
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

    expect(await lifecycle.received()).toEqual([]);
  });

  it("does not post a superseded attempt, then posts the new one at teardown", async () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    emitTransactionEvent({ ...intent, currencyId: "polygon" });

    expect(await lifecycle.received()).toEqual([]);

    close?.();
    expect(await lifecycle.received()).toEqual([
      {
        url: "https://borrow.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned", network: "polygon" }),
      },
    ]);
  });

  it("gives a manifest both products claim to Earn, which has priority", async () => {
    setBorrowManifestIdReader(() => "lido");
    const lidoIntent: LogEvent = { ...intent, manifestId: "lido", earnTransactionType: "delegate" };

    expect(toTxLifecyclePayload(lidoIntent, "desktop")).not.toBeNull();
    emitTransactionEvent(lidoIntent);
    emitTransactionEvent({ ...success, manifestId: "lido" });

    const origins = (await lifecycle.received()).map(call => new URL(call.url).origin);
    expect(origins.length).toBeGreaterThan(0);
    expect(origins.every(origin => origin === "https://earn.example.test")).toBe(true);
  });

  it("keeps Earn's events for a doubly claimed manifest when Borrow monitoring is off", async () => {
    setBorrowTxLifecycleFlagReader(() => false);
    setBorrowManifestIdReader(() => "lido");
    const lidoIntent: LogEvent = { ...intent, manifestId: "lido", earnTransactionType: "delegate" };

    emitTransactionEvent(lidoIntent);
    emitTransactionEvent({ ...success, manifestId: "lido" });

    const origins = (await lifecycle.received()).map(call => new URL(call.url).origin);
    expect(origins.length).toBeGreaterThan(0);
    expect(origins.every(origin => origin === "https://earn.example.test")).toBe(true);
  });

  it("leaves Earn's attempt on a doubly claimed manifest to Earn at Borrow mount and teardown", async () => {
    setBorrowManifestIdReader(() => "lido");
    const lidoIntent: LogEvent = { ...intent, manifestId: "lido", earnTransactionType: "delegate" };

    emitTransactionEvent(lidoIntent);
    const close = startBorrowLifecycleMonitoring("desktop", "lido", true);
    await lifecycle.forget();
    close?.();
    expect(await lifecycle.received()).toEqual([]);

    emitTransactionEvent({ ...success, manifestId: "lido" });
    expect(await lifecycle.received()).toEqual([
      {
        url: "https://earn.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ event: "tx_terminal", outcome: "success" }),
      },
    ]);
  });

  it("sends a terminal to the product that opened the attempt after the claim moved", async () => {
    setEarnTxLifecycleFlagReader(() => false);
    setBorrowManifestIdReader(() => "lido");
    const lidoIntent: LogEvent = { ...intent, manifestId: "lido", earnTransactionType: "delegate" };

    const close = startBorrowLifecycleMonitoring("desktop", "lido", true);
    emitTransactionEvent(lidoIntent);
    setEarnTxLifecycleFlagReader(() => true);
    emitTransactionEvent({ ...success, manifestId: "lido" });

    // Borrow opened it, so its `reports` filter drops the success and nothing reaches Earn.
    expect(await lifecycle.received()).toEqual([]);
    close?.();
    expect(await lifecycle.received()).toEqual([]);
  });

  it("lets Borrow claim a doubly claimed manifest when Earn monitoring is off", async () => {
    setEarnTxLifecycleFlagReader(() => false);
    setBorrowManifestIdReader(() => "lido");
    const lidoIntent: LogEvent = { ...intent, manifestId: "lido", earnTransactionType: "delegate" };

    const close = startBorrowLifecycleMonitoring("desktop", "lido", true);
    emitTransactionEvent(lidoIntent);
    close?.();

    expect(await lifecycle.received()).toEqual([
      {
        url: "https://borrow.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned" }),
      },
    ]);
  });

  it("falls back to the staging sink when the build sets no base URL", async () => {
    setBorrowTxLifecycleBaseUrl(undefined);
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent(intent);
    close?.();

    expect((await lifecycle.received())[0]?.url).toBe(
      "https://global.api.stg.ledger-test.com/borrow/v1/tx/lifecycle",
    );
  });
});
