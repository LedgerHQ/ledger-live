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
  resolveTxLifecycleProduct,
  sendTxLifecycle as sendForProduct,
  type TxLifecyclePayload,
  type TxLifecycleProduct,
} from "./txLifecycle";
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
    { manifestId: "earn", pathway: TransactionPathway.WalletApiSignAndBroadcast },
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

  it.each(["generic-dapp", "earn", "earn-stg", "earn-prd-eks", undefined])(
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
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

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

  beforeEach(() => {
    clearPendingTxLifecycle("desktop");
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
  });

  afterEach(() => {
    clearPendingTxLifecycle("desktop");
    fetchSpy.mockRestore();
  });

  it("gives a manifest two products claim to neither", () => {
    const event = { status: "intent", stage: TransactionStage.Sign, ...common } as LogEvent;
    const claims = product({ id: "a", pathOf: () => "dapp" });

    expect(resolveTxLifecycleProduct([claims, product({ id: "b" })], event)?.product).toBe(claims);
    expect(
      resolveTxLifecycleProduct([claims, product({ id: "b", pathOf: () => "dapp" })], event),
    ).toBeUndefined();
  });

  it("clears one product's attempts and keeps the other's", () => {
    const a = product({ id: "a" });
    const b = product({ id: "b" });
    sendForProduct(a, payload, "app-a");
    sendForProduct(b, payload, "app-b");
    fetchSpy.mockClear();

    clearPendingTxLifecycle("desktop", "a");
    abandonPendingDappTxLifecycle("desktop", "app-a");
    abandonPendingDappTxLifecycle("desktop", "app-b");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://b.example.test/v1/tx/lifecycle");
  });

  it("moves the pending state for payloads the product does not report", () => {
    const quiet = product({ id: "quiet", reports: () => false });
    sendForProduct(quiet, payload, "app");
    sendForProduct(quiet, { ...payload, event: "tx_terminal", outcome: "success" }, "app");
    abandonPendingDappTxLifecycle("desktop", "app");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts an abandoned attempt to the sink of the product that opened it", () => {
    let url = "https://first.example.test";
    sendForProduct(product({ id: "a", baseUrl: () => url }), payload, "app");
    url = "https://second.example.test";
    sendForProduct(product({ id: "b" }), { ...payload, currency_family: "solana" }, "app");

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls[1][0]).toBe("https://second.example.test/v1/tx/lifecycle");
    expect(JSON.parse(fetchSpy.mock.calls[1][1]?.body as string)).toMatchObject({
      failure_class: "abandoned",
      currency_family: "tezos",
    });
  });
});
