import { setBorrowManifestIdReader } from "./borrowApps";
import {
  setBorrowTxLifecycleBaseUrl,
  setBorrowTxLifecycleFlagReader,
  startBorrowLifecycleMonitoring,
} from "./borrowLifecycleHost";
import { isEarnApp, setEarnManifestIdReader } from "./earnApps";
import {
  clearDismissedEarnAppSign,
  installEarnLifecycleHost,
  isEarnTxLifecycleMonitoringEnabled,
  setEarnTxLifecycleFlagReader,
  setTxLifecycleBaseUrl,
  startDappLifecycleMonitoring,
  startEarnAppLifecycleMonitoring,
} from "./earnLifecycleHost";
import { ErrorCategory } from "./errorCategory";
import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "./logEvent";
import { emitTransactionEvent, resetTransactionObservers } from "./observer";
import { setStakeProgramAppsReader } from "./stakingApps";
import { clearPendingTxLifecycle } from "./txLifecycle";
import { listenToTxLifecycle } from "./txLifecycleEndpoint.mock";
import { registerTxLifecycleObserver } from "./txLifecycleProducts";

describe("earn lifecycle host wiring", () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    clearPendingTxLifecycle("desktop");
    clearPendingTxLifecycle("mobile");
    setTxLifecycleBaseUrl("https://earn.example.test");
    process.env.LEDGER_CLIENT_VERSION = "ll/test";
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    setEarnTxLifecycleFlagReader(() => true);
  });

  afterEach(() => {
    clearPendingTxLifecycle("desktop");
    clearPendingTxLifecycle("mobile");
    setEarnTxLifecycleFlagReader(null);
    setStakeProgramAppsReader(null);
    setTxLifecycleBaseUrl(undefined);
    fetchSpy.mockRestore();
    delete process.env.LEDGER_CLIENT_VERSION;
  });

  const bodies = () =>
    fetchSpy.mock.calls.map(([, init]) => JSON.parse(String(init?.body))) as Record<
      string,
      unknown
    >[];

  it("opens a stake redirect attempt and abandons it when the webview goes away", () => {
    const close = startDappLifecycleMonitoring("desktop", "stakekit", true, true);
    expect(bodies()).toEqual([
      expect.objectContaining({ event: "tx_intent", path: "dapp", platform: "desktop" }),
    ]);

    close?.();

    expect(bodies().at(-1)).toMatchObject({
      event: "tx_terminal",
      outcome: "failure",
      failure_class: "abandoned",
    });
  });

  it("ignores an open that is not a stake redirect", () => {
    expect(startDappLifecycleMonitoring("mobile", "kiln-widget", false, true)).toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("drops the pending attempt instead of opening one when the kill-switch is off", () => {
    startDappLifecycleMonitoring("mobile", "kiln-widget", true, true);
    fetchSpy.mockClear();

    const close = startDappLifecycleMonitoring("mobile", "kiln-widget", true, false);
    close?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("injects the boot readers and clears pending attempts when the flag is turned off", () => {
    let enabled = true;
    const onStoreChange = installEarnLifecycleHost({
      platform: "desktop",
      readEnabled: () => enabled,
      readStakePrograms: () => ({
        enabled: true,
        params: { redirects: { ethereum: { platform: "not-this-version" } } },
      }),
      // The client only opens what its own version resolves, so that is what is monitored.
      resolveVersionedRedirects: () => ({
        enabled: true,
        params: { redirects: { ethereum: { platform: "future-stake-app" } } },
      }),
      readAppVersion: () => "2.0.0",
      readManifestId: () => undefined,
      apiBaseUrl: "https://staging.example.test/earn/",
    });

    expect(isEarnTxLifecycleMonitoringEnabled()).toBe(true);
    // Only the injected reader makes this remote-config app eligible for monitoring.
    const close = startDappLifecycleMonitoring("desktop", "future-stake-app", true, true);
    expect(bodies()).toHaveLength(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://staging.example.test/earn/v1/tx/lifecycle");
    fetchSpy.mockClear();

    enabled = false;
    onStoreChange();
    close?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("earn live app lifecycle", () => {
  const lifecycle = listenToTxLifecycle();

  const common = {
    appVersion: "lld/2.0.0",
    pathway: TransactionPathway.WalletApiSignAndBroadcast,
    manifestId: "earn",
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
  const teardownAbandon = (network = "ethereum") => ({
    url: "https://earn.example.test/v1/tx/lifecycle",
    body: expect.objectContaining({
      event: "tx_terminal",
      outcome: "failure",
      failure_class: "abandoned",
      path: "earn",
      network,
    }),
  });

  const opened: Array<() => void> = [];
  const startEarnApp = (manifestId = "earn", enabled = true) => {
    const close = startEarnAppLifecycleMonitoring("desktop", manifestId, enabled);
    if (close) opened.push(close);
    return close;
  };

  beforeEach(() => {
    setTxLifecycleBaseUrl("https://earn.example.test");
    setBorrowTxLifecycleBaseUrl("https://borrow.example.test");
    setEarnTxLifecycleFlagReader(() => true);
    setBorrowTxLifecycleFlagReader(() => true);
    registerTxLifecycleObserver("desktop");
  });

  afterEach(() => {
    resetTransactionObservers();
    clearPendingTxLifecycle("desktop");
    opened.splice(0).forEach(close => close());
    setEarnTxLifecycleFlagReader(null);
    setBorrowTxLifecycleFlagReader(null);
    setEarnManifestIdReader(null);
    setBorrowManifestIdReader(null);
    setStakeProgramAppsReader(null);
    setTxLifecycleBaseUrl(undefined);
    setBorrowTxLifecycleBaseUrl(undefined);
  });

  it("recognises the known manifests and the one the flag configures", () => {
    expect(["earn", "earn-stg", "earn-prd-eks"].every(id => isEarnApp(id))).toBe(true);
    expect(isEarnApp("earn-canary")).toBe(false);
    setEarnManifestIdReader(() => "earn-canary");
    expect(isEarnApp("earn-canary")).toBe(true);
    expect(isEarnApp(undefined)).toBe(false);
    expect(isEarnApp("stakekit")).toBe(false);
    setEarnManifestIdReader(() => {
      throw new Error("store not ready");
    });
    expect(isEarnApp("earn-canary")).toBe(false);
  });

  it("leaves intent and success to the live app", async () => {
    const close = startEarnApp();
    emitTransactionEvent(intent);
    emitTransactionEvent(success);
    close?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("posts an attempt still pending when the Earn webview goes away to the Earn sink, once", async () => {
    const close = startEarnApp();
    emitTransactionEvent(intent);
    close?.();
    close?.();

    expect(await lifecycle.received()).toEqual([teardownAbandon()]);
  });

  it("monitors the manifest the flag configures", async () => {
    setEarnManifestIdReader(() => "earn-canary");
    const close = startEarnApp("earn-canary");
    emitTransactionEvent({ ...intent, manifestId: "earn-canary" });
    close?.();

    expect(await lifecycle.received()).toEqual([teardownAbandon()]);
  });

  it("leaves a device refusal to the live app and closes the attempt", async () => {
    const close = startEarnApp();
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

  it("leaves a closed sign modal to the live app, which reports it as a cancel", async () => {
    const close = startEarnApp();
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

  it("does not post a dismissed sign drawer, which the live app reports as a cancel", async () => {
    const close = startEarnApp();
    emitTransactionEvent(intent);
    clearDismissedEarnAppSign("desktop", "earn");
    close?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("keeps a partner dApp attempt when a sign drawer on it is dismissed", async () => {
    const closeDapp = startDappLifecycleMonitoring("desktop", "stakekit", true, true);
    await lifecycle.forget();
    clearDismissedEarnAppSign("desktop", "stakekit");
    closeDapp?.();

    expect(await lifecycle.received()).toEqual([
      {
        url: "https://earn.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned", path: "dapp" }),
      },
    ]);
  });

  it("keeps a Borrow attempt when a sign drawer on it is dismissed", async () => {
    const close = startBorrowLifecycleMonitoring("desktop", "borrow", true);
    emitTransactionEvent({ ...intent, manifestId: "borrow" });
    clearDismissedEarnAppSign("desktop", "borrow");
    close?.();

    expect(await lifecycle.received()).toEqual([
      {
        url: "https://borrow.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned", path: "borrow" }),
      },
    ]);
  });

  it("does not post a superseded attempt, then posts the new one at teardown", async () => {
    const close = startEarnApp();
    emitTransactionEvent(intent);
    emitTransactionEvent({ ...intent, currencyId: "polygon" });
    expect(await lifecycle.received()).toEqual([]);

    close?.();
    expect(await lifecycle.received()).toEqual([teardownAbandon("polygon")]);
  });

  it("posts one abandon for a repeated identical intent", async () => {
    const close = startEarnApp();
    emitTransactionEvent(intent);
    emitTransactionEvent(intent);
    close?.();

    expect(await lifecycle.received()).toEqual([teardownAbandon()]);
  });

  it("drops a success that arrives after the webview went away", async () => {
    const close = startEarnApp();
    emitTransactionEvent(intent);
    close?.();
    emitTransactionEvent(success);

    expect(await lifecycle.received()).toEqual([teardownAbandon()]);
  });

  it("does not report an attempt left pending before the webview mounted", async () => {
    emitTransactionEvent(intent);
    startEarnApp()?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("drops the pending attempt and never posts when the flag is off at mount", async () => {
    emitTransactionEvent(intent);
    expect(startEarnApp("earn", false)).toBeUndefined();
    startEarnApp()?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("does not post when the flag turns off before the webview goes away", async () => {
    const close = startEarnApp();
    emitTransactionEvent(intent);
    setEarnTxLifecycleFlagReader(() => false);
    close?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("does not open an attempt while the flag is off", async () => {
    setEarnTxLifecycleFlagReader(() => false);
    emitTransactionEvent(intent);
    setEarnTxLifecycleFlagReader(() => true);
    const close = startEarnApp();
    close?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("clears Earn live app attempts when the kill-switch turns off at runtime", async () => {
    let enabled = true;
    const listener = installEarnLifecycleHost({
      platform: "desktop",
      readEnabled: () => enabled,
      readStakePrograms: () => null,
      resolveVersionedRedirects: feature => feature,
      readAppVersion: () => "2.0.0",
      readManifestId: () => undefined,
      apiBaseUrl: "https://earn.example.test",
    });
    const close = startEarnApp();
    emitTransactionEvent(intent);

    enabled = false;
    listener();
    enabled = true;
    close?.();

    expect(await lifecycle.received()).toEqual([]);
  });

  it("ignores a manifest that is not the Earn live app and leaves its attempt alone", async () => {
    const closeDapp = startDappLifecycleMonitoring("desktop", "stakekit", true, true);
    await lifecycle.forget();

    expect(startEarnApp("stakekit")).toBeUndefined();
    closeDapp?.();

    expect(await lifecycle.received()).toEqual([
      {
        url: "https://earn.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned", path: "dapp" }),
      },
    ]);
  });

  it("keeps a stake redirect into the Earn live app from closing another webview's attempt", async () => {
    const closeEarn = startEarnApp();
    emitTransactionEvent(intent);

    expect(startDappLifecycleMonitoring("desktop", "earn", true, true)).toBeUndefined();
    expect(await lifecycle.received()).toEqual([]);

    closeEarn?.();
    expect(await lifecycle.received()).toEqual([teardownAbandon()]);
  });

  describe("with two webviews on the Earn manifest (the tab and a stacked screen)", () => {
    it("does not let the older webview abandon the newer one's attempt", async () => {
      const closeTab = startEarnApp();
      const closeStacked = startEarnApp();
      emitTransactionEvent(intent);

      closeTab?.();
      expect(await lifecycle.received()).toEqual([]);

      closeStacked?.();
      expect(await lifecycle.received()).toEqual([teardownAbandon()]);
    });

    it("abandons each webview's own attempt when it goes away", async () => {
      const closeTab = startEarnApp();
      const closeStacked = startEarnApp();
      emitTransactionEvent(intent);

      closeStacked?.();
      expect(await lifecycle.received()).toEqual([teardownAbandon()]);

      await lifecycle.forget();
      emitTransactionEvent({ ...intent, currencyId: "polygon" });
      closeTab?.();
      expect(await lifecycle.received()).toEqual([teardownAbandon("polygon")]);
    });

    it("does not drop the tab's attempt when a stacked screen mounts and closes", async () => {
      const closeTab = startEarnApp();
      emitTransactionEvent(intent);

      startEarnApp()?.();
      expect(await lifecycle.received()).toEqual([]);

      closeTab?.();
      expect(await lifecycle.received()).toEqual([teardownAbandon()]);
    });
  });

  it("keeps an Earn manifest Borrow is also configured for with Earn", async () => {
    setBorrowManifestIdReader(() => "earn");
    const closeEarn = startEarnApp();
    emitTransactionEvent(intent);
    startBorrowLifecycleMonitoring("desktop", "earn", true)?.();
    expect(await lifecycle.received()).toEqual([]);

    closeEarn?.();
    expect(await lifecycle.received()).toEqual([teardownAbandon()]);
  });

  it("lets Borrow claim an Earn manifest it is configured for when Earn monitoring is off", async () => {
    setEarnTxLifecycleFlagReader(() => false);
    setBorrowManifestIdReader(() => "earn");
    const close = startBorrowLifecycleMonitoring("desktop", "earn", true);
    emitTransactionEvent(intent);
    close?.();

    expect(await lifecycle.received()).toEqual([
      {
        url: "https://borrow.example.test/v1/tx/lifecycle",
        body: expect.objectContaining({ failure_class: "abandoned", path: "borrow" }),
      },
    ]);
  });
});
