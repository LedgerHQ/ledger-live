import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { Transaction, ZcashAccount } from "@ledgerhq/coin-zcash/types";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import SendAmountFields from "../SendAmountFields";

const mockStartShieldedSync = jest.fn();
jest.mock("../useZcashShieldedSync", () => ({
  useZcashShieldedSync: jest.fn(() => ({
    startShieldedSync: mockStartShieldedSync,
    stopShieldedSync: jest.fn(),
    saveSyncState: jest.fn(),
  })),
}));

const baseAccount = createFixtureAccount();

const buildZcashAccount = () =>
  ({
    ...baseAccount,
    currency: { ...baseAccount.currency, id: "zcash" } as CryptoCurrency,
  }) as unknown as ZcashAccount;

// A coin-zcash transaction carries no utxoStrategy, networkInfo or feePerByte:
// ZIP-317 prices the fee per action.
const buildTransaction = (overrides: Record<string, unknown> = {}): Transaction =>
  ({
    family: "zcash",
    amount: new BigNumber(0),
    recipient: "",
    transferType: "shielded",
    feesStrategy: "medium",
    ...overrides,
  }) as unknown as Transaction;

const renderFields = (transaction: Transaction, flagEnabled = true) =>
  render(
    <SendAmountFields.component
      account={buildZcashAccount()}
      parentAccount={null}
      transaction={transaction}
      status={{ errors: {}, warnings: {} } as never}
      onChange={jest.fn()}
      updateTransaction={jest.fn()}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }) },
  );

describe("zcash SendAmountFields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("zcash fee handling", () => {
    // Zcash uses ZIP-317 fees (no sat/vByte market), so there is no fee selector,
    // independent of the zcashShielded feature flag.
    it.each([true, false])(
      "renders no fee selector or coin control (shielded flag = %s)",
      flagEnabled => {
        renderFields(buildTransaction({ feesStrategy: "custom" }), flagEnabled);

        expect(screen.queryByTestId("send-fee-mode")).not.toBeInTheDocument();
        expect(screen.queryByTestId("currency-textbox")).not.toBeInTheDocument();
        expect(screen.queryByText("Coin control")).not.toBeInTheDocument();
        expect(screen.queryByText("Medium")).not.toBeInTheDocument();
      },
    );
  });

  describe("shielded sync trigger on mount", () => {
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
});
