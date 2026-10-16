import {
  PENDING_RENT_EXPIRY_MARGIN_MS,
  PENDING_RENT_MIN_WINDOW_MS,
  clearPendingRent,
  getPendingRent,
  recordPendingRent,
  resetPendingRentsForTests,
  subscribePendingRents,
} from "./pendingRents";

const NOW = 1_000_000;
const rent = (overrides = {}) => ({
  mainAccountId: "acc-1",
  orderId: "order-1",
  payerAddress: "TPayer",
  paymentTxId: "tx-1",
  receiverAddress: "TPayer",
  energyNeeded: 64_285n,
  ...overrides,
});

describe("pendingRents", () => {
  beforeEach(() => resetPendingRentsForTests());

  it("keeps a rent until its payment can no longer land", () => {
    recordPendingRent(rent(), NOW + 360_000, NOW);
    expect(getPendingRent("acc-1", NOW + 360_000)?.paymentTxId).toBe("tx-1");
    expect(getPendingRent("acc-1", NOW + 360_000 + PENDING_RENT_EXPIRY_MARGIN_MS)).toBeNull();
  });

  it("never keeps a rent for less than the minimum delivery window", () => {
    recordPendingRent(rent(), NOW - 10_000, NOW);
    expect(getPendingRent("acc-1", NOW + PENDING_RENT_MIN_WINDOW_MS - 1)).not.toBeNull();
    expect(getPendingRent("acc-1", NOW + PENDING_RENT_MIN_WINDOW_MS)).toBeNull();
  });

  it("is keyed by main account", () => {
    recordPendingRent(rent(), NOW + 360_000, NOW);
    expect(getPendingRent("acc-2", NOW)).toBeNull();
  });

  it("keeps accounts apart: clearing one leaves the other", () => {
    recordPendingRent(rent(), NOW + 360_000, NOW);
    recordPendingRent(rent({ mainAccountId: "acc-2", paymentTxId: "tx-2" }), NOW + 360_000, NOW);

    clearPendingRent("acc-1");

    expect(getPendingRent("acc-1", NOW)).toBeNull();
    expect(getPendingRent("acc-2", NOW)?.paymentTxId).toBe("tx-2");
  });

  it("clears only the named payment", () => {
    recordPendingRent(rent(), NOW + 360_000, NOW);
    clearPendingRent("acc-1", "tx-other");
    expect(getPendingRent("acc-1", NOW)).not.toBeNull();
    clearPendingRent("acc-1", "tx-1");
    expect(getPendingRent("acc-1", NOW)).toBeNull();
  });

  it("replaces an older rent on the same account", () => {
    recordPendingRent(rent(), NOW + 360_000, NOW);
    recordPendingRent(rent({ paymentTxId: "tx-2" }), NOW + 400_000, NOW);
    expect(getPendingRent("acc-1", NOW)?.paymentTxId).toBe("tx-2");
  });

  describe("subscribePendingRents", () => {
    it("tells subscribers which account a rent was recorded or cleared on", () => {
      const listener = jest.fn();
      subscribePendingRents(listener);

      recordPendingRent(rent(), NOW + 360_000, NOW);
      expect(listener).toHaveBeenLastCalledWith("acc-1");
      recordPendingRent(rent({ mainAccountId: "acc-2" }), NOW + 360_000, NOW);
      expect(listener).toHaveBeenLastCalledWith("acc-2");

      clearPendingRent("acc-1", "tx-1");
      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenLastCalledWith("acc-1");
    });

    it("stays quiet when a clear removes nothing", () => {
      recordPendingRent(rent(), NOW + 360_000, NOW);
      const listener = jest.fn();
      subscribePendingRents(listener);

      clearPendingRent("acc-1", "tx-other");
      clearPendingRent("acc-2");

      expect(listener).not.toHaveBeenCalled();
    });

    it("tells subscribers when a read drops an expired rent", () => {
      recordPendingRent(rent(), NOW + 360_000, NOW);
      const listener = jest.fn();
      subscribePendingRents(listener);

      getPendingRent("acc-1", NOW);
      expect(listener).not.toHaveBeenCalled();
      getPendingRent("acc-1", NOW + 360_000 + PENDING_RENT_EXPIRY_MARGIN_MS);
      expect(listener).toHaveBeenCalledWith("acc-1");
    });

    it("stops telling a subscriber that unsubscribed", () => {
      const listener = jest.fn();
      const unsubscribe = subscribePendingRents(listener);

      unsubscribe();
      recordPendingRent(rent(), NOW + 360_000, NOW);

      expect(listener).not.toHaveBeenCalled();
    });

    it("drops its subscribers on reset", () => {
      const listener = jest.fn();
      subscribePendingRents(listener);

      resetPendingRentsForTests();
      recordPendingRent(rent(), NOW + 360_000, NOW);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
