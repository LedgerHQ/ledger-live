/**
 * Covers the wiring between the bridge seam and Segment, which no other test reaches: the
 * observer is registered as an import side effect, so a broken import or a mapping change
 * would otherwise fail silently in production rather than in CI.
 */
const track = jest.fn();
jest.mock("./segment", () => ({ track: (...args: unknown[]) => track(...args) }));

import {
  clearPendingTxLifecycle,
  emitTransactionEvent,
  setEarnTxLifecycleFlagReader,
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "@ledgerhq/transaction-observability";

import "./registerTransactionObserver";

const mockFetch = jest.fn().mockResolvedValue(undefined);
let lifecycleEnabled = true;

const lifecycleBodies = () =>
  mockFetch.mock.calls.map(([, init]) => JSON.parse(init.body as string));

const stakingEvent = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    status: "success",
    stage: TransactionStage.Broadcast,
    appVersion: "llc/test",
    pathway: TransactionPathway.Send,
    currencyId: "cardano",
    family: "cardano",
    currencyTicker: "ADA",
    isTestnet: false,
    isSendMax: false,
    dataSource: TransactionDataSource.Sign,
    earnTransactionType: "delegate",
    rawTransactionType: "delegate",
    validators: ["pool123"],
    ...over,
  }) as unknown as LogEvent;

describe("desktop transaction observer", () => {
  beforeEach(() => {
    track.mockClear();
    mockFetch.mockClear();
    process.env.EARN_API_BASE_URL = "https://earn.example.test";
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    global.fetch = mockFetch as unknown as typeof fetch;
    lifecycleEnabled = true;
    setEarnTxLifecycleFlagReader(() => lifecycleEnabled);
    clearPendingTxLifecycle("desktop");
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    setEarnTxLifecycleFlagReader(null);
    delete process.env.EARN_API_BASE_URL;
    jest.restoreAllMocks();
  });

  it("forwards a staking outcome to Segment", () => {
    emitTransactionEvent(stakingEvent());

    expect(track).toHaveBeenCalledTimes(1);
    const [event, properties] = track.mock.calls[0];
    expect(event).toBe("earn_transaction_completed");
    expect(properties).toMatchObject({
      flow: "stake",
      tx_pathway: "send",
      transaction_type: "delegate",
      input_currency: "ada",
      network: "cardano",
    });
  });

  it("dispatches a minimal desktop lifecycle event outside Segment", () => {
    emitTransactionEvent(stakingEvent({ status: "intent", stage: TransactionStage.Sign }));
    emitTransactionEvent(stakingEvent());

    expect(mockFetch.mock.calls[0][0]).toBe("https://earn.example.test/v1/tx/lifecycle");
    expect(lifecycleBodies().at(-1)).toEqual({
      schema_version: 1,
      event: "tx_terminal",
      path: "native",
      platform: "desktop",
      currency_family: "other",
      currency_id: "cardano",
      network: "cardano",
      app_version: "llc/test",
      outcome: "success",
    });
  });

  it("keeps the manifest as local dapp correlation context only", () => {
    emitTransactionEvent(
      stakingEvent({
        status: "intent",
        stage: TransactionStage.Sign,
        manifestId: "stakekit",
        pathway: TransactionPathway.WalletApiSignAndBroadcast,
      }),
    );

    expect(lifecycleBodies()[0]).toMatchObject({ event: "tx_intent", path: "dapp" });
    expect(lifecycleBodies()[0]).not.toHaveProperty("manifestId");
  });

  it("keeps Segment independent when lifecycle monitoring is disabled", () => {
    lifecycleEnabled = false;

    emitTransactionEvent(stakingEvent());

    expect(track).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * `track` self-gates on analytics consent, but its third argument bypasses that gate. Passing
   * only two arguments is what keeps these events subject to consent, so it is asserted rather
   * than assumed.
   */
  it("never passes the consent-bypassing third argument", () => {
    emitTransactionEvent(stakingEvent());

    expect(track.mock.calls[0]).toHaveLength(2);
  });

  it("sends nothing for a transaction with no staking action", () => {
    emitTransactionEvent(stakingEvent({ earnTransactionType: undefined }));

    expect(track).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends nothing for the Earn live-app, which emits these events itself", () => {
    emitTransactionEvent(stakingEvent({ manifestId: "earn" }));

    expect(track).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
