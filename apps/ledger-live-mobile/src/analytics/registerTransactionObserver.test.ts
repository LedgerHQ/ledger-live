/**
 * Covers the wiring between the bridge seam and Segment, which no other test reaches: the
 * observer is registered as an import side effect, so a broken import or a mapping change
 * would otherwise fail silently in production rather than in CI.
 *
 * `@shared/analytics` is mocked in Jest setup so this test can assert the `track` call without
 * starting Segment.
 */
import { track } from "@shared/analytics";
import {
  clearPendingTxLifecycle,
  emitTransactionEvent,
  setEarnTxLifecycleFlagReader,
  setTxLifecycleBaseUrl,
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "@ledgerhq/transaction-observability";

import "./registerTransactionObserver";

const mockedTrack = jest.mocked(track);
const mockFetch = jest.fn().mockResolvedValue(undefined);
let lifecycleEnabled = true;

const lifecycleBodies = () =>
  mockFetch.mock.calls.map(([, init]) => JSON.parse(init.body as string));

const stakingEvent = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    status: "success",
    stage: TransactionStage.Broadcast,
    appVersion: "llm/test",
    pathway: TransactionPathway.Send,
    currencyId: "solana",
    family: "solana",
    currencyTicker: "SOL",
    isTestnet: false,
    isSendMax: false,
    dataSource: TransactionDataSource.Sign,
    earnTransactionType: "delegate",
    rawTransactionType: "stake.createAccount",
    validators: ["voteAcc"],
    ...over,
  }) as unknown as LogEvent;

describe("mobile transaction observer", () => {
  beforeEach(() => {
    mockedTrack.mockClear();
    mockFetch.mockClear();
    setTxLifecycleBaseUrl("https://earn.example.test");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    global.fetch = mockFetch as unknown as typeof fetch;
    lifecycleEnabled = true;
    setEarnTxLifecycleFlagReader(() => lifecycleEnabled);
    clearPendingTxLifecycle("mobile");
  });
  afterEach(() => {
    setEarnTxLifecycleFlagReader(null);
    setTxLifecycleBaseUrl(undefined);
  });

  it("forwards a staking outcome to Segment", () => {
    emitTransactionEvent(stakingEvent());

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    const [event, properties] = mockedTrack.mock.calls[0];
    expect(event).toBe("earn_transaction_completed");
    expect(properties).toMatchObject({
      flow: "stake",
      tx_pathway: "send",
      transaction_type: "delegate",
      raw_transaction_type: "stake.createAccount",
      input_currency: "sol",
      network: "solana",
    });
  });

  it("dispatches a minimal mobile lifecycle event outside Segment", () => {
    emitTransactionEvent(stakingEvent({ status: "intent", stage: TransactionStage.Sign }));
    emitTransactionEvent(stakingEvent());

    expect(mockFetch.mock.calls[0][0]).toBe("https://earn.example.test/v1/tx/lifecycle");
    expect(lifecycleBodies().at(-1)).toEqual({
      schema_version: 1,
      event: "tx_terminal",
      path: "native",
      platform: "mobile",
      currency_family: "solana",
      currency_id: "solana",
      network: "solana",
      app_version: "llm/test",
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

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * `track` self-gates on analytics consent, but its third argument bypasses that gate. Passing
   * only two arguments is what keeps these events subject to consent, so it is asserted rather
   * than assumed.
   */
  it("never passes the consent-bypassing third argument", () => {
    emitTransactionEvent(stakingEvent());

    expect(mockedTrack.mock.calls[0]).toHaveLength(2);
  });

  it("sends nothing for a transaction with no staking action", () => {
    emitTransactionEvent(stakingEvent({ earnTransactionType: undefined }));

    expect(mockedTrack).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends nothing for the Earn live-app, which emits these events itself", () => {
    emitTransactionEvent(stakingEvent({ manifestId: "earn" }));

    expect(mockedTrack).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
