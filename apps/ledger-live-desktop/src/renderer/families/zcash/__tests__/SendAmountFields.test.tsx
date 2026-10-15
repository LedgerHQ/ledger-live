import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Transaction, ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import SendAmountFields from "../SendAmountFields";

const mockStartShieldedSync = jest.fn();
jest.mock("../useZcashShieldedSync", () => ({
  useZcashShieldedSync: jest.fn(() => ({
    startShieldedSync: mockStartShieldedSync,
    stopShieldedSync: jest.fn(),
    saveSyncState: jest.fn(),
  })),
}));

const buildZcashAccount = () =>
  ({
    ...createFixtureAccount(),
    currency: { id: "zcash", family: "zcash" } as CryptoCurrency,
  }) as unknown as ZcashAccount;

// ZIP-317 prices the fee per action: the transaction carries no fee rate or utxo strategy.
const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "zcash",
    amount: new BigNumber(0),
    recipient: "",
    transferType: "shielded",
    feesStrategy: "medium",
    ...overrides,
  }) as Transaction;

const renderFields = (transaction: Transaction, flagEnabled = true) =>
  render(
    <SendAmountFields.component
      account={buildZcashAccount()}
      transaction={transaction}
      status={{ errors: {}, warnings: {} } as never}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }) },
  );

describe("zcash SendAmountFields", () => {
  beforeEach(() => mockStartShieldedSync.mockClear());

  // Zcash uses ZIP-317 fees (no fee market): there is no fee selector at all.
  it.each([true, false])("renders no fee selector (shielded flag = %s)", flagEnabled => {
    renderFields(buildTransaction({ sender: "public" }), flagEnabled);

    expect(screen.queryByTestId("send-fee-mode")).not.toBeInTheDocument();
    expect(screen.queryByTestId("currency-textbox")).not.toBeInTheDocument();
  });

  it("starts a shielded sync when sending from the private pool", () => {
    renderFields(buildTransaction({ sender: "private" }));

    expect(mockStartShieldedSync).toHaveBeenCalledTimes(1);
  });

  it("does not start a shielded sync when sending from the public pool", () => {
    renderFields(buildTransaction({ sender: "public" }));

    expect(mockStartShieldedSync).not.toHaveBeenCalled();
  });

  it("renders the shielded sync state banner when sending from the private pool", () => {
    renderFields(buildTransaction({ sender: "private" }));

    // No privateInfo on the fixture account -> syncState defaults to
    // "disabled", which the banner renders as its stopped/resume variant.
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeInTheDocument();
  });

  it("renders no banner when sending from the public pool", () => {
    renderFields(buildTransaction({ sender: "public" }));

    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
  });
});
