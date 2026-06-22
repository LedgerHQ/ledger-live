import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoAccount, AleoUnspentRecord } from "@ledgerhq/live-common/families/aleo/types";
import { MAX_PRIVATE_RECORDS_PER_TRANSACTION } from "@ledgerhq/live-common/families/aleo/constants";
import { getEstimatedSigningTime } from "@ledgerhq/live-common/families/aleo/utils";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { ALEO_ACCOUNT_1, makeTokenAccount } from "../__mocks__/account.mock";
import { makeRecord } from "../__mocks__/record.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import QuickAmountSelector from "./QuickAmountSelector";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("~/renderer/components/FormattedVal", () => ({
  __esModule: true,
  default: ({ val }: { val: BigNumber }) => (
    <span data-testid="formatted-val">{val.toString()}</span>
  ),
}));
jest.mock("~/renderer/components/Label", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));
jest.mock("@ledgerhq/live-common/families/aleo/utils", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/utils"),
  getEstimatedSigningTime: jest.fn((_count: number, sec: string, _min: string) => `~1${sec}`),
  sumPrivateRecords: jest.fn((records: { microcredits: string }[]) =>
    records.reduce((acc, r) => acc.plus(r.microcredits), new BigNumber(0)),
  ),
}));
jest.mock("~/renderer/icons/TachometerHigh", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/icons/TachometerMedium", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/icons/TachometerLow", () => ({ __esModule: true, default: () => null }));

const mockUseAccountUnit = jest.mocked(useAccountUnit);

const makeAleoAccount = (records: AleoUnspentRecord[]): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance: new BigNumber(0),
    privateBalance: new BigNumber(0),
    unspentPrivateRecords: records,
    provableApi: null,
    lastPrivateSyncDate: null,
  },
});

describe("QuickAmountSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({ code: "ALEO", name: "Aleo", magnitude: 6 });
  });

  it("renders three strategy tiles (fast, balanced, full)", () => {
    const account = makeAleoAccount([]);
    const transaction = makeAleoTransaction();

    render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={jest.fn()}
      />,
    );

    // i18n keys rendered as-is in the test environment
    expect(screen.getByText("Fast")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  it("all strategy tiles are disabled when there are no records", async () => {
    const account = makeAleoAccount([]);
    const transaction = makeAleoTransaction();
    const updateTransaction = jest.fn();

    const { user } = render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={updateTransaction}
      />,
    );

    // Tiles exist but clicking them should not trigger updateTransaction
    await user.click(screen.getByText("Fast"));
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it("calls updateTransaction with isSendMax when clicking fast tile with exactly the available records", async () => {
    // 2 records — fewer than balanced min (5) so only fast can be selected, and it covers all records → isSendMax
    const account = makeAleoAccount([makeRecord("300"), makeRecord("100")]);
    const transaction = makeAleoTransaction();
    const updateTransaction = jest.fn();

    const { user } = render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={updateTransaction}
      />,
    );

    // The fast tile contains the "strategies.fast" text — click on its wrapper
    const fastLabel = screen.getByText("Fast");
    await user.click(fastLabel);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    // The updater should set useAllAmount: true (isSendMax path)
    const updater = updateTransaction.mock.calls[0][0];
    const result = updater(transaction);
    expect(result.useAllAmount).toBe(true);
    expect(result.amount.isEqualTo(new BigNumber(0))).toBe(true);
  });

  it("calls updateTransaction with exact rangeSum when enough records exist beyond the fast max", async () => {
    // 6 records — fast tile gets top 4, balanced tile gets top 8 (limited to 6)
    const account = makeAleoAccount([
      makeRecord("600"),
      makeRecord("500"),
      makeRecord("400"),
      makeRecord("300"),
      makeRecord("200"),
      makeRecord("100"),
    ]);
    const transaction = makeAleoTransaction();
    const updateTransaction = jest.fn();

    const { user } = render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={updateTransaction}
      />,
    );

    // Click the fast tile label
    await user.click(screen.getByText("Fast"));

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0];
    const result = updater(transaction);
    // Top 4 records sorted descending: 600+500+400+300 = 1800
    expect(result.amount.isEqualTo(new BigNumber(1800))).toBe(true);
    expect(result.useAllAmount).toBe(false);
  });

  it("sets useAllAmount when full tile is clicked with more records than the system cap", async () => {
    // MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1 records — full tile fills exactly the cap → isSendMax
    const records = Array.from({ length: MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1 }, (_, i) =>
      makeRecord(String((i + 1) * 100)),
    );
    const account = makeAleoAccount(records);
    const transaction = makeAleoTransaction();
    const updateTransaction = jest.fn();

    const { user } = render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={updateTransaction}
      />,
    );

    await user.click(screen.getByText("Full"));

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0];
    const result = updater(transaction);
    expect(result.useAllAmount).toBe(true);
    expect(result.amount.isEqualTo(new BigNumber(0))).toBe(true);
  });

  it("calls onSelect callback after a tile is clicked", async () => {
    const account = makeAleoAccount([makeRecord("100"), makeRecord("200")]);
    const transaction = makeAleoTransaction();
    const onSelect = jest.fn();

    const { user } = render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={jest.fn()}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText("Fast"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not render record summary when the transaction is not private", () => {
    const account = makeAleoAccount([makeRecord("1000")]);
    const transaction = makeAleoTransaction();

    render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={jest.fn()}
      />,
    );

    expect(screen.getByTestId("record-summary")).not.toBeVisible();
  });

  it("does not render record summary when amountRecordCommitments is empty", () => {
    const account = makeAleoAccount([makeRecord("1000")]);
    const transaction = makeAleoTransaction({
      mode: "transfer_private",
      properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    });

    render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={jest.fn()}
      />,
    );

    expect(screen.getByTestId("record-summary")).not.toBeVisible();
  });

  it("renders record summary for private transaction", () => {
    const account = makeAleoAccount([makeRecord("1000")]);
    const transaction = makeAleoTransaction({
      mode: "transfer_private",
      properties: { amountRecordCommitments: ["c1", "c2"], feeRecordCommitment: null },
    });

    render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={jest.fn()}
      />,
    );

    expect(screen.getByTestId("record-summary")).toHaveTextContent("2 records · ~1sec");
    expect(jest.mocked(getEstimatedSigningTime)).toHaveBeenCalledWith(2, "sec", expect.any(String));
  });

  it("renders the spendable balance label", () => {
    const account = makeAleoAccount([]);
    const transaction = makeAleoTransaction();

    render(
      <QuickAmountSelector
        account={account}
        transaction={transaction}
        updateTransaction={jest.fn()}
      />,
    );

    expect(screen.getByText(/Spendable Balance/i)).toBeInTheDocument();
  });

  describe("with token account", () => {
    it("calls updateTransaction when fast tile is clicked with token account records", async () => {
      const account = makeTokenAccount([makeRecord("300"), makeRecord("100")]);
      const transaction = makeAleoTransaction();
      const updateTransaction = jest.fn();

      const { user } = render(
        <QuickAmountSelector
          account={account}
          transaction={transaction}
          updateTransaction={updateTransaction}
        />,
      );

      await user.click(screen.getByText("Fast"));

      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = updateTransaction.mock.calls[0][0];
      expect(updater(transaction).useAllAmount).toBe(true);
    });

    it("all tiles are disabled when token account has null unspentPrivateRecords", async () => {
      const account = makeTokenAccount(null);
      const transaction = makeAleoTransaction();
      const updateTransaction = jest.fn();

      const { user } = render(
        <QuickAmountSelector
          account={account}
          transaction={transaction}
          updateTransaction={updateTransaction}
        />,
      );

      await user.click(screen.getByText("Fast"));

      expect(updateTransaction).not.toHaveBeenCalled();
    });
  });
});
