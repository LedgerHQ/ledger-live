/**
 * Covers the wiring between the bridge seam and Segment, which no other test reaches: the
 * observer is registered as an import side effect, so a broken import or a mapping change
 * would otherwise fail silently in production rather than in CI.
 *
 * `./segment` is mocked rather than imported: it sits in a require cycle with `~/analytics`,
 * and this test needs only the `track` call it makes.
 */
const track = jest.fn();
jest.mock("./segment", () => ({ track: (...args: unknown[]) => track(...args) }));

import {
  emitTransactionEvent,
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "@ledgerhq/transaction-observability";

// Importing the module is what registers the observer. It must come after the mock above.
import "./registerTransactionObserver";

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
  beforeEach(() => track.mockClear());

  it("forwards a staking outcome to Segment", () => {
    emitTransactionEvent(stakingEvent());

    expect(track).toHaveBeenCalledTimes(1);
    const [event, properties] = track.mock.calls[0];
    expect(event).toBe("earn_transaction_completed");
    expect(properties).toMatchObject({
      flow: "stake",
      tx_pathway: "send",
      transaction_type: "delegate",
      // Solana's own wording survives to the broadcast event through correlation.
      raw_transaction_type: "stake.createAccount",
      input_currency: "sol",
      network: "solana",
    });
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
  });

  it("sends nothing for the Earn live-app, which emits these events itself", () => {
    emitTransactionEvent(stakingEvent({ manifestId: "earn" }));

    expect(track).not.toHaveBeenCalled();
  });
});
