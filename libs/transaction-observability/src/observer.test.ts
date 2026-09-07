import {
  emitTransactionEvent,
  resetTransactionObservers,
  setTransactionObserver,
} from "./observer";
import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "./logEvent";

const event = {
  status: "success",
  stage: TransactionStage.Broadcast,
  appVersion: "t",
  pathway: TransactionPathway.Send,
  currencyId: "cardano",
  family: "cardano",
  currencyTicker: "ADA",
  isTestnet: false,
  isSendMax: false,
  dataSource: TransactionDataSource.Broadcast,
} as LogEvent;

describe("transaction observer registry", () => {
  afterEach(() => {
    resetTransactionObservers();
    jest.restoreAllMocks();
  });

  it("delivers an event to every registered observer", () => {
    const first = jest.fn();
    const second = jest.fn();
    setTransactionObserver(first);
    setTransactionObserver(second);

    emitTransactionEvent(event);

    expect(first).toHaveBeenCalledWith(event);
    expect(second).toHaveBeenCalledWith(event);
  });

  it("stops delivering once unsubscribed, leaving the others registered", () => {
    const kept = jest.fn();
    const removed = jest.fn();
    setTransactionObserver(kept);
    const unsubscribe = setTransactionObserver(removed);

    unsubscribe();
    emitTransactionEvent(event);

    expect(removed).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when unsubscribing twice", () => {
    const kept = jest.fn();
    const unsubscribe = setTransactionObserver(() => {});
    setTransactionObserver(kept);

    unsubscribe();
    unsubscribe();
    emitTransactionEvent(event);

    expect(kept).toHaveBeenCalledTimes(1);
  });

  // The load-bearing guarantee: this registry sits in the sign/broadcast path, so a broken
  // analytics sink must never surface as a failed transaction.
  it("isolates a throwing observer from the emitter and from its peers", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const after = jest.fn();
    setTransactionObserver(() => {
      throw new Error("sink is broken");
    });
    setTransactionObserver(after);

    expect(() => emitTransactionEvent(event)).not.toThrow();
    expect(after).toHaveBeenCalledWith(event);
  });

  it("emits to nobody when no observer is registered", () => {
    expect(() => emitTransactionEvent(event)).not.toThrow();
  });
});
