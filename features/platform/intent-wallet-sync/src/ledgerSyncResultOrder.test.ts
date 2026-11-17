import { createLedgerSyncResultOrder } from "./ledgerSyncResultOrder";

describe("createLedgerSyncResultOrder", () => {
  it("should keep a late ticket when no newer one was delivered", () => {
    const order = createLedgerSyncResultOrder();
    const older = order.take();
    order.take();

    expect(order.isStale(older)).toBe(false);
  });

  it("should mark a ticket stale once a newer one was delivered", () => {
    const order = createLedgerSyncResultOrder();
    const older = order.take();
    const newer = order.take();

    order.markDelivered(newer);

    expect(order.isStale(older)).toBe(true);
    expect(order.isStale(newer)).toBe(false);
  });

  it("should not move back when an older ticket is delivered after a newer one", () => {
    const order = createLedgerSyncResultOrder();
    const older = order.take();
    const newer = order.take();
    const newest = order.take();

    order.markDelivered(newer);
    order.markDelivered(older);

    expect(order.isStale(older)).toBe(true);
    expect(order.isStale(newest)).toBe(false);
  });

  it("should keep two orders independent", () => {
    const first = createLedgerSyncResultOrder();
    const second = createLedgerSyncResultOrder();
    const firstTicket = first.take();
    second.take();
    const secondNewer = second.take();

    second.markDelivered(secondNewer);

    expect(first.isStale(firstTicket)).toBe(false);
  });
});
