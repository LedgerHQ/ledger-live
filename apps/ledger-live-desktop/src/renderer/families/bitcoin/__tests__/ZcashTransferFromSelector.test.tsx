import React from "react";
import BigNumber from "bignumber.js";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/constants";
import { render, screen, fireEvent, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import ZcashTransferFromSelector from "../ZcashTransferFromSelector";

jest.mock("~/renderer/hooks/useAccountUnit");
const mockedUseAccountUnit = jest.mocked(useAccountUnit);

// The bridge's updateTransaction merges the patch onto the transaction
// (see libs/ledger-wallet-framework/.../jsHelpers.ts). Replicate that here.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const baseAccount = createFixtureAccount();

const buildAccount = (overrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {}, isZcash = true) =>
  ({
    ...baseAccount,
    balance: new BigNumber(100_000_000),
    currency: { id: isZcash ? "zcash" : "bitcoin" } as CryptoCurrency,
    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ...overrides,
    },
  }) as unknown as Account;

const renderSelector = (
  account: Account,
  transaction: Partial<Transaction>,
  onChange = jest.fn(),
  flagEnabled = true,
) => {
  render(
    <ZcashTransferFromSelector
      account={account}
      transaction={transaction as Transaction}
      onChange={onChange}
    />,
    {
      initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }),
    },
  );
  return onChange;
};

describe("ZcashTransferFromSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAccountUnit.mockReturnValue({ code: "ZEC", name: "Zcash", magnitude: 8 });
  });

  it("renders both cards with Public active by default and persists the default to the transaction", () => {
    const onChange = renderSelector(buildAccount(), {});

    expect(screen.getByTestId("zcash-transfer-from-selector")).toBeVisible();
    expect(screen.getByTestId("transfer-from-public")).toBeVisible();
    expect(screen.getByTestId("transfer-from-private")).toBeVisible();

    // Public default is written to the transaction state once on mount.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "public" }));
  });

  it("does not rewrite the default when a sender is already set", () => {
    const onChange = renderSelector(buildAccount(), { sender: "private" } as Partial<Transaction>);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects Private when the Private card is clicked", () => {
    const onChange = renderSelector(buildAccount({ ufvk: "uview-test" }), {});
    onChange.mockClear(); // ignore the on-mount default write

    fireEvent.click(screen.getByTestId("transfer-from-private"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "private" }));
  });

  it("selects Public when the Public card is clicked from a Private selection", () => {
    const onChange = renderSelector(buildAccount({ ufvk: "uview-test" }), {
      sender: "private",
    } as Partial<Transaction>);

    fireEvent.click(screen.getByTestId("transfer-from-public"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "public" }));
  });

  it("keeps the Private card clickable in every sync state (never disabled)", () => {
    const onChange = renderSelector(buildAccount({ syncState: "disabled", ufvk: "uview-test" }), {
      sender: "public",
    } as Partial<Transaction>);
    onChange.mockClear();

    fireEvent.click(screen.getByTestId("transfer-from-private"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "private" }));
  });

  it("shows the unavailable hint on the Private card when no FVK is available", () => {
    renderSelector(buildAccount({ ufvk: null }), { sender: "public" } as Partial<Transaction>);
    expect(screen.getByTestId("transfer-from-private-unavailable")).toBeInTheDocument();
  });

  it("hides the unavailable hint when an FVK is available", () => {
    renderSelector(buildAccount({ ufvk: "uview-test" }), {
      sender: "public",
    } as Partial<Transaction>);
    expect(screen.queryByTestId("transfer-from-private-unavailable")).not.toBeInTheDocument();
  });

  it("renders nothing when the zcashShielded feature flag is off", () => {
    renderSelector(buildAccount(), {}, jest.fn(), false);
    expect(screen.queryByTestId("zcash-transfer-from-selector")).not.toBeInTheDocument();
  });

  it("renders nothing for a non-Zcash account", () => {
    renderSelector(buildAccount({}, false), {});
    expect(screen.queryByTestId("zcash-transfer-from-selector")).not.toBeInTheDocument();
  });

  it("surfaces ironwoodBalance as not-yet-sendable rather than as spendable private balance", () => {
    renderSelector(
      buildAccount({
        ironwoodBalance: new BigNumber(50_000_000),
        orchardBalance: new BigNumber(0),
        saplingBalance: new BigNumber(0),
        ufvk: "uview-test",
      }),
      {},
    );

    // The Ironwood pool has no send/sign path yet, so it is shown as a
    // "not yet available" hint carrying the amount, not as the spendable amount.
    const ironwoodHint = screen.getByTestId("transfer-from-private-ironwood-unavailable");
    expect(ironwoodHint).toHaveTextContent(/0\.5 ZEC/);
    // The spendable (Orchard) balance is 0, so the card's headline amount is 0.
    expect(screen.getByTestId("transfer-from-private")).toHaveTextContent(/0 ZEC/);
  });

  it("excludes the sapling balance from the spendable private amount", () => {
    renderSelector(
      buildAccount({
        orchardBalance: new BigNumber(30_000_000),
        saplingBalance: new BigNumber(50_000_000),
        ironwoodBalance: new BigNumber(0),
        ufvk: "uview-test",
      }),
      {},
    );

    // Only Orchard (0.3 ZEC) is spendable; Sapling (0.5 ZEC) is not counted.
    const privateCard = screen.getByTestId("transfer-from-private");
    expect(privateCard).toHaveTextContent(/0\.3 ZEC/);
    expect(privateCard).not.toHaveTextContent(/0\.8 ZEC/);
  });

  it("does not show the ironwood hint when there is no ironwood balance", () => {
    renderSelector(
      buildAccount({
        ironwoodBalance: new BigNumber(0),
        orchardBalance: new BigNumber(50_000_000),
        saplingBalance: new BigNumber(0),
        ufvk: "uview-test",
      }),
      {},
    );

    expect(
      screen.queryByTestId("transfer-from-private-ironwood-unavailable"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("transfer-from-private")).toHaveTextContent(/0\.5 ZEC/);
  });
});
