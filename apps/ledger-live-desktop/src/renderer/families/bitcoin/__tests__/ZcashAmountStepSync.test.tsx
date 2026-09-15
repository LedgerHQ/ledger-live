import React from "react";
import { act, render } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { BitcoinAccount, Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { ZcashAmountStepSync } from "../ZcashAmountStepSync";

const mockStartShieldedSync = jest.fn();
jest.mock("../useZcashShieldedSync", () => ({
  useZcashShieldedSync: jest.fn(() => ({
    startShieldedSync: mockStartShieldedSync,
    stopShieldedSync: jest.fn(),
    saveSyncState: jest.fn(),
  })),
}));

const baseAccount = createFixtureAccount();

const buildAccount = (isZcash = true): BitcoinAccount =>
  ({
    ...baseAccount,
    currency: { id: isZcash ? "zcash" : "bitcoin" } as CryptoCurrency,
  }) as unknown as BitcoinAccount;

// coin-zcash's `sender` field doesn't exist on the bitcoin family's own
// Transaction type: author against the real coin-zcash shape and hand it
// across the boundary the same way the component itself does.
const buildTransaction = (sender: "public" | "private" | undefined): Transaction =>
  ({ sender }) as unknown as Transaction;

describe("ZcashAmountStepSync", () => {
  beforeEach(() => jest.clearAllMocks());

  it("starts a shielded sync when the source pool is private on a zcash account", () => {
    render(
      <ZcashAmountStepSync account={buildAccount()} transaction={buildTransaction("private")} />,
    );

    expect(mockStartShieldedSync).toHaveBeenCalledTimes(1);
  });

  it("does not start a shielded sync for a public source pool", () => {
    render(
      <ZcashAmountStepSync account={buildAccount()} transaction={buildTransaction("public")} />,
    );

    expect(mockStartShieldedSync).not.toHaveBeenCalled();
  });

  it("does not start a shielded sync for a non-zcash account, even with a private-looking sender", () => {
    render(
      <ZcashAmountStepSync
        account={buildAccount(false)}
        transaction={buildTransaction("private")}
      />,
    );

    expect(mockStartShieldedSync).not.toHaveBeenCalled();
  });

  it("does not restart the sync on a re-render that only changes an unrelated transaction field", () => {
    const account = buildAccount();
    const { rerender } = render(
      <ZcashAmountStepSync account={account} transaction={buildTransaction("private")} />,
    );
    expect(mockStartShieldedSync).toHaveBeenCalledTimes(1);

    act(() => {
      rerender(
        <ZcashAmountStepSync
          account={account}
          transaction={{ ...buildTransaction("private"), amount: 123 } as unknown as Transaction}
        />,
      );
    });

    expect(mockStartShieldedSync).toHaveBeenCalledTimes(1);
  });

  it("renders nothing, whether or not it starts a sync", () => {
    const { container } = render(
      <ZcashAmountStepSync account={buildAccount()} transaction={buildTransaction("private")} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
