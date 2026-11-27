import { ErrorCategory } from "./errorCategory";
import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "./logEvent";
import {
  earnLifecycleProduct,
  setTxLifecycleBaseUrl,
  startDappTxLifecycle,
} from "./earnLifecycleHost";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  clearPendingTxLifecycle,
  isTeardownAbandon,
  monitorManifestTeardown,
  resolveTxLifecycleProduct,
  sendTxLifecycle as sendForProduct,
  type TxLifecyclePayload,
  type TxLifecycleProduct,
} from "./txLifecycle";
import { listenToTxLifecycle } from "./txLifecycleEndpoint.mock";
import { toTxLifecyclePayload } from "./txLifecycleProducts";

const sendTxLifecycle = (payload: TxLifecyclePayload, manifestId?: string) =>
  sendForProduct(earnLifecycleProduct, payload, manifestId);

const common = {
  appVersion: "lld/2.0.0",
  pathway: TransactionPathway.Send,
  currencyId: "solana",
  family: "solana",
  currencyTicker: "SOL",
  isTestnet: false,
  isSendMax: false,
  dataSource: TransactionDataSource.Sign,
  earnTransactionType: "delegate" as const,
  rawTransactionType: "stake.createAccount",
};

describe("toTxLifecyclePayload", () => {
  it("builds a minimal native intent payload", () => {
    const payload = toTxLifecyclePayload(
      { status: "intent", stage: TransactionStage.Sign, ...common },
      "desktop",
    );

    expect(payload).toEqual({
      schema_version: 1,
      event: "tx_intent",
      path: "native",
      platform: "desktop",
      currency_family: "solana",
      currency_id: "solana",
      network: "solana",
      app_version: "lld/2.0.0",
    });
  });

  it("maps an allow-listed dapp failure and normalizes the EVM family", () => {
    const payload = toTxLifecyclePayload(
      {
        status: "failure",
        stage: TransactionStage.Broadcast,
        error: new Error("sensitive error"),
        errorCategory: ErrorCategory.DeviceDisconnected,
        txPayload: { signature: "sensitive signature" },
        ...common,
        pathway: TransactionPathway.Dapp,
        manifestId: "stakekit",
        currencyId: "ethereum",
        family: "evm",
        tokenId: "ethereum/erc20/usdc",
      },
      "mobile",
    );

    expect(payload).toEqual({
      schema_version: 1,
      event: "tx_terminal",
      path: "dapp",
      platform: "mobile",
      currency_family: "ethereum",
      currency_id: "ethereum/erc20/usdc",
      network: "ethereum",
      app_version: "lld/2.0.0",
      outcome: "failure",
      failure_class: "device_error",
    });
    expect(JSON.stringify(payload)).not.toContain("sensitive");
  });

  it("maps an abandoned attempt separately from a user cancellation", () => {
    const payload = toTxLifecyclePayload(
      {
        status: "failure",
        stage: TransactionStage.Sign,
        error: new Error("dismissed"),
        errorCategory: ErrorCategory.UserModalDismissed,
        abandoned: true,
        ...common,
      },
      "desktop",
    );

    expect(payload).toMatchObject({
      event: "tx_terminal",
      outcome: "failure",
      failure_class: "abandoned",
    });
  });

  it.each([
    ["elrond", "multiversx"],
    ["EVM", "ethereum"],
    ["hedera", "other"],
  ])("normalizes the %s family to %s", (family, expected) => {
    const payload = toTxLifecyclePayload(
      {
        status: "intent",
        stage: TransactionStage.Sign,
        ...common,
        family,
      },
      "desktop",
    );

    expect(payload?.currency_family).toBe(expected);
  });

  it.each([
    [ErrorCategory.UserDeviceRefused, "user_cancel"],
    [ErrorCategory.DeviceWrongAccount, "device_error"],
    [ErrorCategory.Blockchain, "broadcast_error"],
    [ErrorCategory.Unknown, "unknown"],
  ])("maps %s to the %s failure class", (errorCategory, expected) => {
    const payload = toTxLifecyclePayload(
      {
        status: "failure",
        stage: TransactionStage.Sign,
        error: new Error("not serialized"),
        errorCategory,
        ...common,
      },
      "desktop",
    );

    expect(payload).toMatchObject({ failure_class: expected });
  });

  it.each([
    { earnTransactionType: undefined, rawTransactionType: "send" },
    { manifestId: "generic-dapp", pathway: TransactionPathway.Dapp },
    { pathway: TransactionPathway.Swap },
  ])("does not map a non-Earn event: %o", overrides => {
    const event = {
      status: "success",
      stage: TransactionStage.Broadcast,
      ...common,
      ...overrides,
    } as LogEvent;

    expect(toTxLifecyclePayload(event, "desktop")).toBeNull();
  });

  it.each(["earn", "earn-stg", "earn-stg-eks", "earn-prd-eks"])(
    "maps an Earn live app sign on %s onto the earn path",
    manifestId => {
      const event = {
        status: "intent",
        stage: TransactionStage.Sign,
        ...common,
        manifestId,
        pathway: TransactionPathway.WalletApiSignAndBroadcast,
        family: "evm",
      } as LogEvent;

      expect(toTxLifecyclePayload(event, "desktop")).toMatchObject({
        event: "tx_intent",
        path: "earn",
        currency_family: "ethereum",
      });
    },
  );
});

describe("sendTxLifecycle", () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    clearPendingTxLifecycle("desktop");
    clearPendingTxLifecycle("mobile");
    setTxLifecycleBaseUrl("https://earn.example.test/");
    process.env.LEDGER_CLIENT_VERSION = "ll/test";
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
  });

  afterEach(() => {
    clearPendingTxLifecycle("desktop");
    clearPendingTxLifecycle("mobile");
    setTxLifecycleBaseUrl(undefined);
    fetchSpy.mockRestore();
    delete process.env.LEDGER_CLIENT_VERSION;
  });

  const payload: TxLifecyclePayload = {
    schema_version: 1,
    event: "tx_intent",
    path: "native",
    platform: "desktop",
    currency_family: "tezos",
  };

  it("posts the event without waiting for the response", () => {
    sendTxLifecycle(payload);

    expect(fetchSpy).toHaveBeenCalledWith("https://earn.example.test/v1/tx/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  });

  it("does not throw when fetch fails synchronously", () => {
    fetchSpy.mockImplementation(() => {
      throw new Error("offline");
    });

    expect(() => sendTxLifecycle(payload)).not.toThrow();
  });

  it("does not throw when fetch rejects", () => {
    fetchSpy.mockRejectedValue(new Error("offline"));

    expect(() => sendTxLifecycle(payload)).not.toThrow();
  });

  it("does not post an unpaired terminal", () => {
    sendTxLifecycle({
      ...payload,
      event: "tx_terminal",
      outcome: "success",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts one terminal for a pending intent", () => {
    sendTxLifecycle(payload);
    fetchSpy.mockClear();

    sendTxLifecycle({
      ...payload,
      event: "tx_terminal",
      outcome: "success",
    });
    sendTxLifecycle({
      ...payload,
      event: "tx_terminal",
      outcome: "success",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("closes a pending dapp intent as abandoned exactly once", () => {
    sendTxLifecycle({ ...payload, path: "dapp" }, "stakekit");
    sendTxLifecycle({ ...payload, path: "dapp" }, "stakekit");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockClear();

    abandonPendingDappTxLifecycle("desktop", "stakekit");
    abandonPendingDappTxLifecycle("desktop", "stakekit");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toEqual({
      schema_version: 1,
      event: "tx_terminal",
      path: "dapp",
      platform: "desktop",
      currency_family: "tezos",
      outcome: "failure",
      failure_class: "abandoned",
    });
  });

  it("clears a pending dapp intent without posting when disabled", () => {
    sendTxLifecycle({ ...payload, path: "dapp" }, "stakekit");
    clearPendingDappTxLifecycle("desktop", "stakekit");
    fetchSpy.mockClear();

    abandonPendingDappTxLifecycle("desktop", "stakekit");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("clears native and dapp pending attempts without posting", () => {
    sendTxLifecycle(payload);
    sendTxLifecycle({ ...payload, path: "dapp" }, "stakekit");
    fetchSpy.mockClear();

    clearPendingTxLifecycle("desktop");
    abandonPendingDappTxLifecycle("desktop", "stakekit");
    sendTxLifecycle({
      ...payload,
      event: "tx_terminal",
      outcome: "success",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps pending dapp attempts isolated by manifest", () => {
    sendTxLifecycle({ ...payload, path: "dapp" }, "stakekit");
    sendTxLifecycle({ ...payload, path: "dapp", currency_family: "ethereum" }, "kiln-widget");
    fetchSpy.mockClear();

    abandonPendingDappTxLifecycle("desktop", "stakekit");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toMatchObject({
      event: "tx_terminal",
      currency_family: "tezos",
      failure_class: "abandoned",
    });

    fetchSpy.mockClear();
    sendTxLifecycle(
      {
        ...payload,
        path: "dapp",
        currency_family: "ethereum",
        event: "tx_terminal",
        outcome: "success",
      },
      "kiln-widget",
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toMatchObject({
      event: "tx_terminal",
      currency_family: "ethereum",
      outcome: "success",
    });
  });

  it("posts two intents and two terminals for identical native attempts", () => {
    sendTxLifecycle(payload);
    sendTxLifecycle(payload);
    sendTxLifecycle({ ...payload, event: "tx_terminal", outcome: "success" });

    const events = fetchSpy.mock.calls.map(call => JSON.parse(call[1]?.body as string));
    expect(events).toEqual([
      payload,
      {
        ...payload,
        event: "tx_terminal",
        outcome: "failure",
        failure_class: "abandoned",
      },
      payload,
      { ...payload, event: "tx_terminal", outcome: "success" },
    ]);
  });

  it("starts an allow-listed dapp attempt when its platform opens", () => {
    startDappTxLifecycle("mobile", "stakekit");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toEqual({
      schema_version: 1,
      event: "tx_intent",
      path: "dapp",
      platform: "mobile",
      currency_family: "other",
      app_version: "ll/test",
    });
  });

  it.each(["generic-dapp", "earn", "earn-stg", "earn-stg-eks", "earn-prd-eks", undefined])(
    "does not start lifecycle monitoring for %s",
    manifestId => {
      startDappTxLifecycle("desktop", manifestId);

      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("posts an enriched redirect intent so its family joins the terminal counter", () => {
    startDappTxLifecycle("desktop", "stakekit");
    sendTxLifecycle(
      {
        schema_version: 1,
        event: "tx_intent",
        path: "dapp",
        platform: "desktop",
        currency_family: "ethereum",
        currency_id: "ethereum/erc20/usdc",
        network: "ethereum",
        app_version: "ll/test",
      },
      "stakekit",
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchSpy.mock.calls[1][1]?.body as string)).toMatchObject({
      event: "tx_intent",
      currency_family: "ethereum",
      currency_id: "ethereum/erc20/usdc",
      network: "ethereum",
    });
    fetchSpy.mockClear();

    abandonPendingDappTxLifecycle("desktop", "stakekit");

    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toMatchObject({
      event: "tx_terminal",
      currency_family: "ethereum",
      currency_id: "ethereum/erc20/usdc",
      network: "ethereum",
      failure_class: "abandoned",
    });
  });
});

describe("lifecycle products", () => {
  const lifecycle = listenToTxLifecycle();

  const product = (
    overrides: Partial<TxLifecycleProduct> & { id: string },
  ): TxLifecycleProduct => ({
    pathOf: () => undefined,
    isEnabled: () => true,
    baseUrl: () => `https://${overrides.id}.example.test`,
    ...overrides,
  });

  const payload: TxLifecyclePayload = {
    schema_version: 1,
    event: "tx_intent",
    path: "dapp",
    platform: "desktop",
    currency_family: "tezos",
  };

  const receivedUrls = async () => (await lifecycle.received()).map(({ url }) => url);

  beforeEach(() => {
    clearPendingTxLifecycle("desktop");
  });

  afterEach(() => {
    clearPendingTxLifecycle("desktop");
  });

  it("gives a manifest two products claim to the first one listed", () => {
    const event = { status: "intent", stage: TransactionStage.Sign, ...common } as LogEvent;
    const claims = product({ id: "a", pathOf: () => "dapp" });
    const alsoClaims = product({ id: "b", pathOf: () => "dapp" });

    expect(resolveTxLifecycleProduct([claims, product({ id: "b" })], event)?.product).toBe(claims);
    expect(resolveTxLifecycleProduct([claims, alsoClaims], event)?.product).toBe(claims);
    expect(resolveTxLifecycleProduct([alsoClaims, claims], event)?.product).toBe(alsoClaims);
    expect(resolveTxLifecycleProduct([product({ id: "c" })], event)).toBeUndefined();
  });

  it("clears one product's attempts and keeps the other's", async () => {
    const a = product({ id: "a" });
    const b = product({ id: "b" });
    sendForProduct(a, payload, "app-a");
    sendForProduct(b, payload, "app-b");
    await lifecycle.forget();

    clearPendingTxLifecycle("desktop", "a");
    abandonPendingDappTxLifecycle("desktop", "app-a");
    abandonPendingDappTxLifecycle("desktop", "app-b");

    expect(await receivedUrls()).toEqual(["https://b.example.test/v1/tx/lifecycle"]);
  });

  it("moves the pending state for payloads the product does not report", async () => {
    const quiet = product({ id: "quiet", reports: () => false });
    sendForProduct(quiet, payload, "app");
    sendForProduct(quiet, { ...payload, event: "tx_terminal", outcome: "success" }, "app");
    abandonPendingDappTxLifecycle("desktop", "app");

    expect(await lifecycle.received()).toEqual([]);
  });

  it("posts a superseded attempt to the sink of the product that opened it", async () => {
    sendForProduct(product({ id: "a" }), payload, "app");
    sendForProduct(product({ id: "b" }), { ...payload, currency_family: "solana" }, "app");

    const received = await lifecycle.received();
    expect(received.map(({ url }) => url)).toEqual([
      "https://a.example.test/v1/tx/lifecycle",
      "https://a.example.test/v1/tx/lifecycle",
      "https://b.example.test/v1/tx/lifecycle",
    ]);
    expect(received[1].body).toMatchObject({
      failure_class: "abandoned",
      currency_family: "tezos",
    });
  });

  it("posts a terminal through the product that opened the attempt, not the latest claimant", async () => {
    const quiet = product({ id: "quiet", reports: () => false });
    sendForProduct(product({ id: "a" }), payload, "app");
    sendForProduct(
      product({ id: "b" }),
      { ...payload, event: "tx_terminal", outcome: "success" },
      "app",
    );
    sendForProduct(quiet, payload, "other");
    sendForProduct(
      product({ id: "b" }),
      { ...payload, event: "tx_terminal", outcome: "success" },
      "other",
    );

    expect(await receivedUrls()).toEqual([
      "https://a.example.test/v1/tx/lifecycle",
      "https://a.example.test/v1/tx/lifecycle",
    ]);
  });

  it("keeps the intent's path on a terminal claimed by a product with another path", async () => {
    sendForProduct(product({ id: "earn" }), payload, "app");
    sendForProduct(
      product({ id: "borrow" }),
      { ...payload, path: "borrow", event: "tx_terminal", outcome: "success" },
      "app",
    );

    const received = await lifecycle.received();
    expect(received.map(({ url }) => url)).toEqual([
      "https://earn.example.test/v1/tx/lifecycle",
      "https://earn.example.test/v1/tx/lifecycle",
    ]);
    expect(received.map(({ body }) => body)).toEqual([
      expect.objectContaining({ event: "tx_intent", path: "dapp" }),
      expect.objectContaining({ event: "tx_terminal", outcome: "success", path: "dapp" }),
    ]);
  });

  it("only clears or abandons a dApp attempt the named product owns", async () => {
    sendForProduct(product({ id: "a" }), payload, "app");
    await lifecycle.forget();

    clearPendingDappTxLifecycle("desktop", "app", "b");
    abandonPendingDappTxLifecycle("desktop", "app", "b");
    expect(await lifecycle.received()).toEqual([]);

    abandonPendingDappTxLifecycle("desktop", "app", "a");
    expect(await receivedUrls()).toEqual(["https://a.example.test/v1/tx/lifecycle"]);
  });

  describe("dApp placeholder", () => {
    const placeholder: TxLifecyclePayload = { ...payload, currency_family: "other" };

    it.each(["earn", "borrow"] as const)(
      "supersedes a placeholder with an intent on the %s path instead of overwriting it",
      async path => {
        sendForProduct(product({ id: "a" }), placeholder, "app");
        sendForProduct(product({ id: "b" }), { ...payload, path }, "app");

        const received = await lifecycle.received();
        expect(received.map(({ url }) => url)).toEqual([
          "https://a.example.test/v1/tx/lifecycle",
          "https://a.example.test/v1/tx/lifecycle",
          "https://b.example.test/v1/tx/lifecycle",
        ]);
        expect(received[1].body).toMatchObject({
          event: "tx_terminal",
          failure_class: "abandoned",
          path: "dapp",
        });
      },
    );

    it("enriches a placeholder with a dApp intent without closing it", async () => {
      sendForProduct(product({ id: "a" }), placeholder, "app");
      sendForProduct(product({ id: "a" }), payload, "app");

      expect((await lifecycle.received()).map(({ body }) => body)).toEqual([
        expect.objectContaining({ event: "tx_intent", currency_family: "other" }),
        expect.objectContaining({ event: "tx_intent", currency_family: "tezos" }),
      ]);
    });
  });

  describe("webview teardown monitors", () => {
    const opened: Array<() => void> = [];
    const monitor = (target: TxLifecycleProduct, enabled = true) => {
      const close = monitorManifestTeardown("desktop", target, "app", enabled);
      if (close) opened.push(close);
      return close;
    };
    const intent = (target: TxLifecycleProduct, network = "ethereum") =>
      sendForProduct(target, { ...payload, path: "earn", network }, "app");
    const abandonOn = (network: string) =>
      expect.objectContaining({ failure_class: "abandoned", path: "earn", network });
    const bodies = async () => (await lifecycle.received()).map(({ body }) => body);

    const app = product({ id: "app", reports: isTeardownAbandon });

    afterEach(() => {
      clearPendingTxLifecycle("desktop");
      opened.splice(0).forEach(close => close());
    });

    it("abandons the attempt its webview started once, at teardown", async () => {
      const close = monitor(app);
      intent(app);
      close?.();
      close?.();

      expect(await bodies()).toEqual([abandonOn("ethereum")]);
    });

    it("does not let an older webview abandon the newer one's attempt", async () => {
      const closeTab = monitor(app);
      const closeStacked = monitor(app);
      intent(app);

      closeTab?.();
      expect(await bodies()).toEqual([]);

      closeStacked?.();
      expect(await bodies()).toEqual([abandonOn("ethereum")]);
    });

    it("gives the next attempt back to the older webview once the newer one is gone", async () => {
      const closeTab = monitor(app);
      const closeStacked = monitor(app);
      intent(app);
      closeStacked?.();
      expect(await bodies()).toEqual([abandonOn("ethereum")]);

      await lifecycle.forget();
      intent(app, "polygon");
      closeTab?.();
      expect(await bodies()).toEqual([abandonOn("polygon")]);
    });

    it("keeps an attempt a live webview owns when another webview mounts", async () => {
      const closeTab = monitor(app);
      intent(app);
      monitor(app)?.();
      expect(await bodies()).toEqual([]);

      closeTab?.();
      expect(await bodies()).toEqual([abandonOn("ethereum")]);
    });

    it("hands a deduplicated intent to the newest webview", async () => {
      const closeTab = monitor(app);
      intent(app);
      const closeStacked = monitor(app);
      intent(app);

      closeTab?.();
      expect(await bodies()).toEqual([]);

      closeStacked?.();
      expect(await bodies()).toEqual([abandonOn("ethereum")]);
    });

    it("drops an attempt no live webview owns when one mounts", async () => {
      intent(app);
      monitor(app)?.();

      expect(await bodies()).toEqual([]);
    });

    it("drops an attempt whose webview closed while the product was off", async () => {
      let enabled = true;
      const toggled = product({ id: "app", reports: isTeardownAbandon, isEnabled: () => enabled });
      const close = monitor(toggled);
      intent(toggled);
      enabled = false;
      close?.();
      enabled = true;
      monitor(toggled)?.();

      expect(await bodies()).toEqual([]);
    });

    it("drops the product's attempt and monitors nothing when the kill-switch is off", async () => {
      monitor(app);
      intent(app);

      expect(monitor(app, false)).toBeUndefined();
      abandonPendingDappTxLifecycle("desktop", "app");

      expect(await bodies()).toEqual([]);
    });

    it("keeps monitors apart per product", async () => {
      const other = product({ id: "other", reports: isTeardownAbandon });
      const closeApp = monitor(app);
      intent(app);
      monitor(other)?.();
      expect(await lifecycle.received()).toEqual([]);

      closeApp?.();
      expect(await receivedUrls()).toEqual(["https://app.example.test/v1/tx/lifecycle"]);
    });
  });
});
