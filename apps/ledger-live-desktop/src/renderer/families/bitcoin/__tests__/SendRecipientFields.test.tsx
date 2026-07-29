import React from "react";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/constants";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import SendRecipientFields from "../SendRecipientFields";

// The bridge's updateTransaction merges the patch onto the transaction.
// Mocking it also avoids the Suspense boundary that useAccountBridge (React `use`) requires.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const baseAccount = createFixtureAccount();

const buildBitcoinAccount = () => baseAccount;

const buildZcashAccount = (overrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {}) =>
  ({
    ...baseAccount,
    currency: { ...baseAccount.currency, id: "zcash" } as CryptoCurrency,
    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ...overrides,
    },
  }) as never;

const renderComponent = (
  account: ReturnType<typeof createFixtureAccount>,
  sender?: "public" | "private",
  flagEnabled = true,
  transactionOverrides: Record<string, unknown> = {},
) =>
  render(
    <SendRecipientFields.component
      account={account as never}
      parentAccount={null}
      transaction={{ sender, ...transactionOverrides } as never}
      status={{ errors: {}, warnings: {} } as never}
      onChange={jest.fn()}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }) },
  );

describe("SendRecipientFields — existing pending-operation alert regression", () => {
  it("renders no alert for a bitcoin account with no pending operations", () => {
    const account = buildBitcoinAccount();
    renderComponent(account, undefined, false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("SendRecipientFields — Zcash sync state banner integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Zcash + private + stopped → stopped banner visible", () => {
    renderComponent(buildZcashAccount({ syncState: "stopped" }), "private");
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeInTheDocument();
  });

  it("Zcash + private + running → running banner visible", () => {
    renderComponent(buildZcashAccount({ syncState: "running" }), "private");
    expect(screen.getByTestId("zcash-sync-banner-running")).toBeInTheDocument();
  });

  it("Zcash + private + outdated → outdated banner visible", () => {
    renderComponent(buildZcashAccount({ syncState: "outdated" }), "private");
    expect(screen.getByTestId("zcash-sync-banner-outdated")).toBeInTheDocument();
  });

  it("Zcash + private + complete → no banner", () => {
    renderComponent(buildZcashAccount({ syncState: "complete" }), "private");
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
    expect(screen.queryByTestId("zcash-sync-banner-running")).not.toBeInTheDocument();
    expect(screen.queryByTestId("zcash-sync-banner-outdated")).not.toBeInTheDocument();
  });

  it("Zcash + public sender → no banner regardless of syncState", () => {
    renderComponent(buildZcashAccount({ syncState: "stopped" }), "public");
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
  });

  it("Bitcoin account → no banner (regression guard)", () => {
    renderComponent(buildBitcoinAccount(), "private");
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
    expect(screen.queryByTestId("zcash-sync-banner-running")).not.toBeInTheDocument();
    expect(screen.queryByTestId("zcash-sync-banner-outdated")).not.toBeInTheDocument();
  });

  it("zcashShielded flag off → no banner for Zcash account", () => {
    renderComponent(buildZcashAccount({ syncState: "stopped" }), "private", false);
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
  });
});

describe("SendRecipientFields — Zcash memo field", () => {
  it("Zcash + shielded recipient → memo field visible", () => {
    renderComponent(buildZcashAccount({ syncState: "complete" }), "private", true, {
      recipientType: "private",
    });
    expect(screen.getByTestId("memo-tag-input")).toBeInTheDocument();
  });

  it("Zcash + public (transparent) recipient → no memo field", () => {
    renderComponent(buildZcashAccount({ syncState: "complete" }), "public", true, {
      recipientType: "public",
    });
    expect(screen.queryByTestId("memo-tag-input")).not.toBeInTheDocument();
  });

  it("Zcash + shielded recipient but flag off → no memo field", () => {
    renderComponent(buildZcashAccount({ syncState: "complete" }), "private", false, {
      recipientType: "private",
    });
    expect(screen.queryByTestId("memo-tag-input")).not.toBeInTheDocument();
  });

  it("Bitcoin account → no memo field (regression guard)", () => {
    renderComponent(buildBitcoinAccount(), "private", true, { recipientType: "private" });
    expect(screen.queryByTestId("memo-tag-input")).not.toBeInTheDocument();
  });
});
