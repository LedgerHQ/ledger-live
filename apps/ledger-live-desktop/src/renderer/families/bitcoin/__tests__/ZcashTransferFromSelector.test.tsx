import React from "react";
import BigNumber from "bignumber.js";
import {
  DEFAULT_ZCASH_PRIVATE_INFO,
  ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
} from "@ledgerhq/coin-zcash/constants";
import type { ShieldedTransaction } from "@ledgerhq/coin-zcash/network/types";
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

const makeUtxo = (value: number) => ({
  hash: "",
  outputIndex: 0,
  blockHeight: 1,
  address: "",
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});

// Reference height for note maturity: the spendable-balance figure and the
// maturing-funds warning are both derived from real Ironwood notes, mature
// once buried at least ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS below
// `lastProcessedBlock`. `collectIronwoodSpendableNotes` (and so the maturity
// filter) only ever admits "incoming"/"internal" notes carrying every
// spending field, which is what this note fixture provides.
const TIP = 1_000_000; // latest scanned block height
const MATURE_BLOCK = TIP - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;
const ironwoodNote = (
  amount: number,
  index: number,
  transferType: "incoming" | "internal" = "incoming",
) => ({
  amount: new BigNumber(amount),
  transfer_type: transferType,
  memo: "",
  nullifier: index.toString(16).padStart(2, "0").repeat(32),
  rho: "ee".repeat(32),
  rseed: "ff".repeat(32),
  cmx: "11".repeat(32),
  position: String(index),
  recipient: "22".repeat(43),
  isSpent: false,
});
const shieldedTx = (
  blockHeight: number,
  notes: ReturnType<typeof ironwoodNote>[],
): ShieldedTransaction =>
  ({
    blockHeight,
    decryptedData: {
      orchard_outputs: [],
      sapling_outputs: [],
      ironwood_outputs: notes,
    },
  }) as unknown as ShieldedTransaction;
const recentShieldedTx = () => shieldedTx(TIP - 1, [ironwoodNote(5000, 0)]);
const oldShieldedTx = () => shieldedTx(MATURE_BLOCK, [ironwoodNote(5000, 0)]);

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

  it("renders Public and Private cards with Public active by default and persists the default to the transaction", () => {
    const onChange = renderSelector(buildAccount(), {});

    expect(screen.getByTestId("zcash-transfer-from-selector")).toBeVisible();
    expect(screen.getByTestId("transfer-from-public")).toBeVisible();
    expect(screen.getByTestId("transfer-from-private")).toBeVisible();
    expect(screen.queryByTestId("transfer-from-ironwood")).not.toBeInTheDocument();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sender: "public" }));
  });

  it("does not rewrite the default when a sender is already set", () => {
    const onChange = renderSelector(buildAccount(), { sender: "private" } as Partial<Transaction>);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects Private when the Private card is clicked", () => {
    const onChange = renderSelector(buildAccount({ ufvk: "uview-test" }), {});
    onChange.mockClear();

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

  it("disables the Private card and shows why when no FVK is available", () => {
    renderSelector(buildAccount({ ufvk: null }), { sender: "public" } as Partial<Transaction>);
    expect(screen.getByTestId("transfer-from-private")).toBeDisabled();
    expect(screen.getByTestId("transfer-from-private-unavailable")).toBeInTheDocument();
  });

  it("enables the Private card and hides the unavailable hint when an FVK is available", () => {
    renderSelector(buildAccount({ ufvk: "uview-test" }), {
      sender: "public",
    } as Partial<Transaction>);
    expect(screen.getByTestId("transfer-from-private")).not.toBeDisabled();
    expect(screen.queryByTestId("transfer-from-private-unavailable")).not.toBeInTheDocument();
  });

  it("shows the spendable Ironwood balance on the Private card", () => {
    renderSelector(
      buildAccount({
        ironwoodBalance: new BigNumber(50_000_000),
        orchardBalance: new BigNumber(0),
        saplingBalance: new BigNumber(0),
        ufvk: "uview-test",
        lastProcessedBlock: TIP,
        transactions: [shieldedTx(MATURE_BLOCK, [ironwoodNote(50_000_000, 0)])],
      }),
      {},
    );

    expect(screen.getByTestId("transfer-from-private")).toHaveTextContent(/0\.5 ZEC/);
  });

  it("shows 0 ZEC on the Private card when the Ironwood balance is 0", () => {
    renderSelector(
      buildAccount({
        ironwoodBalance: new BigNumber(0),
        orchardBalance: new BigNumber(50_000_000),
        saplingBalance: new BigNumber(0),
        ufvk: "uview-test",
      }),
      {},
    );

    expect(screen.getByTestId("transfer-from-private")).toHaveTextContent(/0 ZEC/);
  });

  it("sources the Public balance from UTXOs via getTransparentBalance, ignoring deprecated pools", () => {
    renderSelector(
      {
        ...buildAccount({
          orchardBalance: new BigNumber(30_000_000),
          saplingBalance: new BigNumber(20_000_000),
          ironwoodBalance: new BigNumber(10_000_000),
          ufvk: "uview-test",
        }),
        // Transparent comes from own UTXOs (0.4 ZEC), not balance − ironwood —
        // same helpers as AccountBalanceSummaryFooter.
        bitcoinResources: { utxos: [makeUtxo(40_000_000)] },
        balance: new BigNumber(50_000_000),
      } as Account,
      {},
    );

    expect(screen.getByTestId("transfer-from-public")).toHaveTextContent(/0\.4 ZEC/);
  });

  it("does not derive the Public balance by subtracting private from account.balance", () => {
    renderSelector(
      {
        ...buildAccount({
          ironwoodBalance: new BigNumber(50_000_000),
          ufvk: "uview-test",
          lastProcessedBlock: TIP,
          transactions: [shieldedTx(MATURE_BLOCK, [ironwoodNote(50_000_000, 0)])],
        }),
        // Stale provenance: balance − ironwood would wrongly yield 0.4 ZEC;
        // UTXOs keep Public correct at 0.1 ZEC.
        balance: new BigNumber(90_000_000),
        bitcoinResources: { utxos: [makeUtxo(10_000_000)] },
      } as Account,
      {},
    );

    expect(screen.getByTestId("transfer-from-public")).toHaveTextContent(/0\.1 ZEC/);
    expect(screen.getByTestId("transfer-from-public")).not.toHaveTextContent(/0\.4 ZEC/);
    expect(screen.getByTestId("transfer-from-private")).toHaveTextContent(/0\.5 ZEC/);
  });

  it(`shows the spendable-balance warning when Private is selected and funds were shielded within the last ${ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS} blocks`, () => {
    renderSelector(
      buildAccount({
        ufvk: "uview-test",
        transactions: [recentShieldedTx()],
        lastProcessedBlock: TIP,
      }),
      {
        sender: "private",
      } as Partial<Transaction>,
    );
    expect(screen.getByTestId("zcash-private-spendable-warning")).toBeVisible();
  });

  it(`hides the spendable-balance warning when the shielded transaction has ${ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS}+ confirmations`, () => {
    renderSelector(
      buildAccount({
        ufvk: "uview-test",
        transactions: [oldShieldedTx()],
        lastProcessedBlock: TIP,
      }),
      {
        sender: "private",
      } as Partial<Transaction>,
    );
    expect(screen.queryByTestId("zcash-private-spendable-warning")).not.toBeInTheDocument();
  });

  it("hides the spendable-balance warning when Public is the selected source even with recent shielded funds", () => {
    renderSelector(
      buildAccount({
        ufvk: "uview-test",
        transactions: [recentShieldedTx()],
        lastProcessedBlock: TIP,
      }),
      {
        sender: "public",
      } as Partial<Transaction>,
    );
    expect(screen.queryByTestId("zcash-private-spendable-warning")).not.toBeInTheDocument();
  });

  it("renders nothing when the zcashShielded feature flag is off", () => {
    renderSelector(buildAccount(), {}, jest.fn(), false);
    expect(screen.queryByTestId("zcash-transfer-from-selector")).not.toBeInTheDocument();
  });

  it("renders nothing for a non-Zcash account", () => {
    renderSelector(buildAccount({}, false), {});
    expect(screen.queryByTestId("zcash-transfer-from-selector")).not.toBeInTheDocument();
  });

  it("does not render the self-transfer toggle (now a sibling slot above the recipient input)", () => {
    renderSelector(buildAccount(), {});
    expect(screen.getByTestId("zcash-transfer-from-selector")).toBeVisible();
    expect(screen.queryByTestId("zcash-self-transfer-toggle")).not.toBeInTheDocument();
  });
});
