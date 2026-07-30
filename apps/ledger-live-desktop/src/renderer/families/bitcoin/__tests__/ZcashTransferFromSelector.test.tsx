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

  it("renders Public and Ironwood cards with Public active by default and persists the default to the transaction", () => {
    const onChange = renderSelector(buildAccount(), {});

    expect(screen.getByTestId("zcash-transfer-from-selector")).toBeVisible();
    expect(screen.getByTestId("transfer-from-public")).toBeVisible();
    expect(screen.getByTestId("transfer-from-ironwood")).toBeVisible();
    expect(screen.queryByTestId("transfer-from-private")).not.toBeInTheDocument();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "public" }));
  });

  it("does not rewrite the default when a sender is already set", () => {
    const onChange = renderSelector(buildAccount(), { sender: "ironwood" } as Partial<Transaction>);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects Ironwood when the Ironwood card is clicked", () => {
    const onChange = renderSelector(buildAccount({ ufvk: "uview-test" }), {});
    onChange.mockClear();

    fireEvent.click(screen.getByTestId("transfer-from-ironwood"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "ironwood" }));
  });

  it("selects Public when the Public card is clicked from an Ironwood selection", () => {
    const onChange = renderSelector(buildAccount({ ufvk: "uview-test" }), {
      sender: "ironwood",
    } as Partial<Transaction>);

    fireEvent.click(screen.getByTestId("transfer-from-public"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "public" }));
  });

  it("disables the Ironwood card when no FVK is available", () => {
    renderSelector(buildAccount({ ufvk: null }), { sender: "public" } as Partial<Transaction>);
    expect(screen.getByTestId("transfer-from-ironwood")).toBeDisabled();
  });

  it("enables the Ironwood card when an FVK is available", () => {
    renderSelector(buildAccount({ ufvk: "uview-test" }), {
      sender: "public",
    } as Partial<Transaction>);
    expect(screen.getByTestId("transfer-from-ironwood")).not.toBeDisabled();
  });

  it("shows the correct ironwood balance on the Ironwood card", () => {
    renderSelector(
      buildAccount({
        ironwoodBalance: new BigNumber(50_000_000),
        orchardBalance: new BigNumber(0),
        saplingBalance: new BigNumber(0),
        ufvk: "uview-test",
      }),
      {},
    );

    expect(screen.getByTestId("transfer-from-ironwood")).toHaveTextContent(/0\.5 ZEC/);
  });

  it("shows 0 ZEC on the Ironwood card when ironwoodBalance is 0", () => {
    renderSelector(
      buildAccount({
        ironwoodBalance: new BigNumber(0),
        orchardBalance: new BigNumber(50_000_000),
        saplingBalance: new BigNumber(0),
        ufvk: "uview-test",
      }),
      {},
    );

    expect(screen.getByTestId("transfer-from-ironwood")).toHaveTextContent(/0 ZEC/);
  });

  it("excludes shielded holdings from the transparent (Public) balance", () => {
    renderSelector(
      buildAccount({
        orchardBalance: new BigNumber(30_000_000),
        saplingBalance: new BigNumber(20_000_000),
        ironwoodBalance: new BigNumber(10_000_000),
        ufvk: "uview-test",
      }),
      {},
    );

    // total = 1 ZEC, shielded = 0.6 ZEC → transparent = 0.4 ZEC
    expect(screen.getByTestId("transfer-from-public")).toHaveTextContent(/0\.4 ZEC/);
  });

  it("renders nothing when the zcashShielded feature flag is off", () => {
    renderSelector(buildAccount(), {}, jest.fn(), false);
    expect(screen.queryByTestId("zcash-transfer-from-selector")).not.toBeInTheDocument();
  });

  it("renders nothing for a non-Zcash account", () => {
    renderSelector(buildAccount({}, false), {});
    expect(screen.queryByTestId("zcash-transfer-from-selector")).not.toBeInTheDocument();
  });
});
