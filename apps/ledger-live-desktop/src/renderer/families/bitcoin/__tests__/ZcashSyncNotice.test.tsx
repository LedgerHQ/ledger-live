import React from "react";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Transaction, ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { ZcashSyncNotice } from "../ZcashSyncNotice";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));
jest.mock("~/renderer/families/bitcoin/ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn(() => ({ type: "test/syncStateUpdater" })),
}));

const baseAccount = createFixtureAccount();

const buildZcashAccount = (
  privateInfoOverrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {},
): ZcashAccount =>
  ({
    ...baseAccount,
    currency: { id: "zcash" } as CryptoCurrency,
    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ...privateInfoOverrides,
    },
  }) as unknown as ZcashAccount;

const buildTransaction = (sender: "public" | "private" | undefined): Transaction =>
  (sender !== undefined ? { family: "bitcoin", sender } : { family: "bitcoin" }) as Transaction;

const renderNotice = (
  account: ZcashAccount | (typeof baseAccount & { currency: { id: string } }),
  sender: "public" | "private" | undefined,
  shieldedEnabled = true,
  onBlockedChange?: (blocked: boolean) => void,
) =>
  render(
    <ZcashSyncNotice
      account={account as ZcashAccount}
      transaction={buildTransaction(sender)}
      onBlockedChange={onBlockedChange}
    />,
    {
      initialState: withFlagOverrides({ zcashShielded: { enabled: shieldedEnabled } }),
    },
  );

describe("ZcashSyncNotice", () => {
  it("renders nothing for a non-Zcash account", () => {
    const nonZcashAccount = { ...baseAccount, currency: { id: "ethereum" } as CryptoCurrency };
    const { container } = renderNotice(nonZcashAccount, "private");
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when sender is public", () => {
    const { container } = renderNotice(buildZcashAccount({ syncState: "running" }), "public");
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the zcashShielded flag is off, even with a private sender and a stalled sync", () => {
    const { container } = renderNotice(
      buildZcashAccount({ syncState: "stopped" }),
      "private",
      false,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the running banner for Zcash + private sender + syncState=running", () => {
    renderNotice(buildZcashAccount({ syncState: "running", progress: 50 }), "private");
    expect(screen.getByTestId("zcash-sync-banner-running")).toBeVisible();
  });

  it("renders the stopped banner for Zcash + private sender + syncState=stopped", () => {
    renderNotice(buildZcashAccount({ syncState: "stopped" }), "private");
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeVisible();
  });

  it("renders nothing for Zcash + private sender + syncState=complete", () => {
    const { container } = renderNotice(buildZcashAccount({ syncState: "complete" }), "private");
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the stopped banner for Zcash + private sender + syncState=disabled (default)", () => {
    renderNotice(buildZcashAccount(), "private");
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeVisible();
  });

  it.each(["running", "stopped", "disabled", "outdated"] as const)(
    "reports blocked for Zcash + private sender + syncState=%s",
    syncState => {
      const onBlockedChange = jest.fn();
      renderNotice(buildZcashAccount({ syncState }), "private", true, onBlockedChange);
      expect(onBlockedChange).toHaveBeenLastCalledWith(true);
    },
  );

  it.each(["complete", "ready"] as const)(
    "does not block once the shielded sync is %s",
    syncState => {
      const onBlockedChange = jest.fn();
      renderNotice(buildZcashAccount({ syncState }), "private", true, onBlockedChange);
      expect(onBlockedChange).toHaveBeenLastCalledWith(false);
    },
  );

  it("does not block a public sender", () => {
    const onBlockedChange = jest.fn();
    renderNotice(buildZcashAccount({ syncState: "running" }), "public", true, onBlockedChange);
    expect(onBlockedChange).toHaveBeenLastCalledWith(false);
  });

  it("does not block when the zcashShielded flag is off", () => {
    const onBlockedChange = jest.fn();
    renderNotice(buildZcashAccount({ syncState: "stopped" }), "private", false, onBlockedChange);
    expect(onBlockedChange).toHaveBeenLastCalledWith(false);
  });
});
