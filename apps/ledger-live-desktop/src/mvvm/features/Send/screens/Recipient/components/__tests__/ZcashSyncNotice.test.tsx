import React from "react";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { ZcashSyncNotice } from "../ZcashSyncNotice";

jest.mock("../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

// ZcashSyncNotice renders the real ZcashSyncStateBanner (not a mock) so this test also exercises
// that component's own zcashShielded-flag gating; these two mocks are its own dependencies.
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));
jest.mock("~/renderer/families/bitcoin/ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn(() => ({ type: "test/syncStateUpdater" })),
}));

const mockUseSendFlowData = jest.mocked(useSendFlowData);

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

const buildState = (account: unknown, sender: "public" | "private" | undefined) =>
  ({
    state: {
      account: {
        account,
        parentAccount: null,
        currency: (account as { currency?: unknown } | null)?.currency,
      },
      transaction: {
        transaction: sender !== undefined ? { family: "bitcoin", sender } : { family: "bitcoin" },
        status: { errors: {}, warnings: {} },
      },
      recipient: null,
    },
    uiConfig: {},
    recipientSearch: { value: "", setValue: jest.fn(), clear: jest.fn() },
    isRecipientAddressComplete: false,
  }) as never;

const renderNotice = (
  account: unknown,
  sender: "public" | "private" | undefined,
  shieldedEnabled = true,
) => {
  mockUseSendFlowData.mockReturnValue(buildState(account, sender));
  return render(<ZcashSyncNotice />, {
    initialState: withFlagOverrides({ zcashShielded: { enabled: shieldedEnabled } }),
  });
};

describe("ZcashSyncNotice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
});
