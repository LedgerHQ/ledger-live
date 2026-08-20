import React from "react";
import { act, render } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import ZcashPostBroadcastSync from "../ZcashPostBroadcastSync";

const mockStartShieldedSync = jest.fn();
jest.mock("../useZcashShieldedSync", () => ({
  useZcashShieldedSync: jest.fn(() => ({
    startShieldedSync: mockStartShieldedSync,
    stopShieldedSync: jest.fn(),
    saveSyncState: jest.fn(),
  })),
}));

const baseAccount = createFixtureAccount();

const buildAccount = (isZcash = true): Account =>
  ({
    ...baseAccount,
    currency: { id: isZcash ? "zcash" : "bitcoin" } as CryptoCurrency,
  }) as unknown as Account;

// coin-zcash's `transferType` field doesn't exist on the bitcoin family's own
// Transaction type (the component receives it typed that way, per
// `@ledgerhq/live-common/families/bitcoin/types`). Author the fixture against
// the real coin-zcash shape and hand it across the boundary the same way the
// component itself does (`as unknown as ZcashTransaction`).
const buildTransaction = (transferType: string | undefined): Transaction =>
  ({ transferType }) as unknown as Transaction;

const operation = { id: "op1", hash: "hash1" } as unknown as Operation;

describe("ZcashPostBroadcastSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts a shielded sync for a shielded transfer on a zcash account", () => {
    render(
      <ZcashPostBroadcastSync
        account={buildAccount()}
        transaction={buildTransaction("shielded")}
        operation={operation}
      />,
    );

    expect(mockStartShieldedSync).toHaveBeenCalledTimes(1);
  });

  const RETRY_COUNT = 8;
  const RETRY_INTERVAL_MS = 90_000;

  it("retries the shielded sync over a window, spaced apart, since a freshly-broadcast tx isn't mined yet", () => {
    render(
      <ZcashPostBroadcastSync
        account={buildAccount()}
        transaction={buildTransaction("shielded")}
        operation={operation}
      />,
    );

    expect(mockStartShieldedSync).toHaveBeenCalledTimes(1);

    for (let attempt = 2; attempt <= RETRY_COUNT; attempt++) {
      act(() => {
        jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      });
      expect(mockStartShieldedSync).toHaveBeenCalledTimes(attempt);
    }

    act(() => {
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
    });
    expect(mockStartShieldedSync).toHaveBeenCalledTimes(RETRY_COUNT);
  });

  it("keeps retrying after unmount, since closing the Send modal should not cut off the retry window", () => {
    const { unmount } = render(
      <ZcashPostBroadcastSync
        account={buildAccount()}
        transaction={buildTransaction("shielded")}
        operation={operation}
      />,
    );

    expect(mockStartShieldedSync).toHaveBeenCalledTimes(1);
    unmount();

    act(() => {
      jest.advanceTimersByTime(RETRY_COUNT * RETRY_INTERVAL_MS);
    });
    expect(mockStartShieldedSync).toHaveBeenCalledTimes(RETRY_COUNT);
  });

  it("does not start a shielded sync for a fully transparent transfer", () => {
    render(
      <ZcashPostBroadcastSync
        account={buildAccount()}
        transaction={buildTransaction("transparent")}
        operation={operation}
      />,
    );

    expect(mockStartShieldedSync).not.toHaveBeenCalled();
  });

  it("does not start a shielded sync for a non-zcash account, even for a shielded-looking transaction", () => {
    render(
      <ZcashPostBroadcastSync
        account={buildAccount(false)}
        transaction={buildTransaction("shielded")}
        operation={operation}
      />,
    );

    expect(mockStartShieldedSync).not.toHaveBeenCalled();
  });

  it("renders nothing, whether or not it starts a sync", () => {
    const { container } = render(
      <ZcashPostBroadcastSync
        account={buildAccount()}
        transaction={buildTransaction("shielded")}
        operation={operation}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
