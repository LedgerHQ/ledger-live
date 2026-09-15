import { setEnv } from "@shared/env";
import { ErrorCategory } from "./errorCategory";
import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "./logEvent";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  sendTxLifecycle,
  startDappTxLifecycle,
  toTxLifecyclePayload,
  type TxLifecyclePayload,
} from "./txLifecycle";

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
    setEnv("EARN_API_BASE_URL", "https://earn.example.test/");
    setEnv("LEDGER_CLIENT_VERSION", "ll/test");
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
  });

  afterEach(() => {
    sendTxLifecycle({
      ...payload,
      event: "tx_terminal",
      outcome: "failure",
      failure_class: "unknown",
    });
    abandonPendingDappTxLifecycle("desktop");
    fetchSpy.mockRestore();
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
    sendTxLifecycle({ ...payload, path: "dapp" });
    sendTxLifecycle({ ...payload, path: "dapp" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockClear();

    abandonPendingDappTxLifecycle("desktop");
    abandonPendingDappTxLifecycle("desktop");

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
    sendTxLifecycle({ ...payload, path: "dapp" });
    clearPendingDappTxLifecycle("desktop");
    fetchSpy.mockClear();

    abandonPendingDappTxLifecycle("desktop");

    expect(fetchSpy).not.toHaveBeenCalled();
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

  it("enriches a redirect intent at sign without posting a duplicate intent", () => {
    startDappTxLifecycle("desktop", "stakekit");
    sendTxLifecycle({
      schema_version: 1,
      event: "tx_intent",
      path: "dapp",
      platform: "desktop",
      currency_family: "ethereum",
      currency_id: "ethereum/erc20/usdc",
      network: "ethereum",
      app_version: "ll/test",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockClear();

    abandonPendingDappTxLifecycle("desktop");

    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toMatchObject({
      event: "tx_terminal",
      currency_family: "ethereum",
      currency_id: "ethereum/erc20/usdc",
      network: "ethereum",
      failure_class: "abandoned",
    });
  });
});
