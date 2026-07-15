import React from "react";
import BigNumber from "bignumber.js";
import { Linking, Text } from "react-native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AleoAccount, AleoUnspentRecord } from "@ledgerhq/live-common/families/aleo/types";
import { render, screen } from "@tests/test-renderer";
import { QuickAmountSelector } from "../QuickAmountSelector";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { urls } from "~/utils/urls";

jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({ name: "ALEO", code: "ALEO", magnitude: 6 })),
}));

jest.mock("~/components/CurrencyUnitValue", () => ({
  __esModule: true,
  default: ({ value }: { value: BigNumber }) => <Text>{value.toString()}</Text>,
}));

const mockUseKeyboardVisible = jest.fn(() => ({ isKeyboardVisible: false, keyboardHeight: 0 }));
jest.mock("~/logic/keyboardVisible", () => ({
  useKeyboardVisible: () => mockUseKeyboardVisible(),
}));

const mockUpdateTransaction = jest.fn();

function makeRecord(microcredits: string): AleoUnspentRecord {
  return { microcredits } as unknown as AleoUnspentRecord;
}

function makeAccount(records: AleoUnspentRecord[]): AleoAccount {
  return {
    ...(ALEO_ACCOUNT_1 as AleoAccount),
    aleoResources: {
      transparentBalance: new BigNumber(0),
      privateBalance: new BigNumber(0),
      unspentPrivateRecords: records,
      provableApi: null,
      lastPrivateSyncDate: null,
    },
  };
}

function makePrivateTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "aleo",
    mode: "transfer_private",
    amount: new BigNumber(0),
    useAllAmount: false,
    properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    ...overrides,
  } as unknown as Transaction;
}

const manyRecords = Array.from({ length: 16 }, (_, i) => makeRecord(`${(20 - i) * 100000}`));
const sixRecords = Array.from({ length: 6 }, (_, i) => makeRecord(`${(6 - i) * 100000}`));

function renderSelector(
  account: unknown,
  transaction: Transaction,
  maxSpendable: BigNumber | null = null,
) {
  return render(
    <QuickAmountSelector
      account={account as never}
      transaction={transaction}
      updateTransaction={mockUpdateTransaction}
      maxSpendable={maxSpendable}
    />,
  );
}

describe("QuickAmountSelector", () => {
  beforeEach(() => {
    mockUpdateTransaction.mockClear();
    mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: false, keyboardHeight: 0 });
  });

  it("renders null for a non-aleo transaction", () => {
    const { toJSON } = renderSelector(ALEO_ACCOUNT_1, {
      family: "ethereum",
    } as unknown as Transaction);

    expect(toJSON()).toBeNull();
  });

  it("renders null for an aleo public transaction", () => {
    const { toJSON } = renderSelector(ALEO_ACCOUNT_1, {
      family: "aleo",
      mode: "transfer_public",
    } as unknown as Transaction);

    expect(toJSON()).toBeNull();
  });

  describe("with more spendable records than the Full tier cap (16 records)", () => {
    const account = makeAccount(manyRecords);
    const transaction = makePrivateTransaction();

    it("shows all 3 tiles enabled with correct amounts, record counts, and signing times", () => {
      renderSelector(account, transaction);

      expect(screen.getByText("Quick select")).toBeOnTheScreen();
      expect(screen.getByText("Fast")).toBeOnTheScreen();
      expect(screen.getByText("Balanced")).toBeOnTheScreen();
      expect(screen.getByText("Full")).toBeOnTheScreen();

      expect(screen.getByText("7400000")).toBeOnTheScreen();
      expect(screen.getByText("13200000")).toBeOnTheScreen();
      // Max Spendable Balance line and the Full tile both show the same capped sum.
      expect(screen.getAllByText("18900000")).toHaveLength(2);

      expect(screen.getByText("4 records")).toBeOnTheScreen();
      expect(screen.getByText("8 records")).toBeOnTheScreen();
      expect(screen.getByText("14 records")).toBeOnTheScreen();

      expect(screen.getByText("~50 s")).toBeOnTheScreen();
      expect(screen.getByText("~1.5 min")).toBeOnTheScreen();
      expect(screen.getByText("~2.5 min")).toBeOnTheScreen();
    });

    it("shows the bridge-estimated maxSpendable value instead of its own capped sum, when provided", () => {
      renderSelector(account, transaction, new BigNumber("19999999"));

      expect(screen.getByText("19999999")).toBeOnTheScreen();
      // Only the Full tile shows "18900000" now — the Max Spendable Balance row shows the
      // provided maxSpendable estimate instead of its own capped, non-fee-aware sum.
      expect(screen.getAllByText("18900000")).toHaveLength(1);
    });

    it("opens the info tooltip when tapping the Quick select label, with a working learn-more link", async () => {
      const { user } = renderSelector(account, transaction);

      await user.press(screen.getByText("Quick select"));

      expect(screen.getByText(/Sender, amount and recipient hidden on-chain\./)).toBeOnTheScreen();

      await user.press(screen.getByText("Learn more"));

      expect(Linking.openURL).toHaveBeenCalledWith(urls.maxSpendable);
    });

    it("blocks the tiles and the tooltip while the keyboard is visible", async () => {
      mockUseKeyboardVisible.mockReturnValue({ isKeyboardVisible: true, keyboardHeight: 300 });
      const { user } = renderSelector(account, transaction);

      await user.press(screen.getByText("Quick select"));
      expect(
        screen.queryByText(/Sender, amount and recipient hidden on-chain\./),
      ).not.toBeOnTheScreen();

      await user.press(screen.getByText("Fast"));
      expect(mockUpdateTransaction).not.toHaveBeenCalled();
    });

    it("calls updateTransaction with the tier sum when tapping the Fast tile", async () => {
      const { user } = renderSelector(account, transaction);

      await user.press(screen.getByText("Fast"));

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
      const updater = mockUpdateTransaction.mock.calls[0][0];
      const result = updater(transaction);
      expect(result.useAllAmount).toBe(false);
      expect((result.amount as BigNumber).toString()).toBe("7400000");
    });

    it("calls updateTransaction with useAllAmount when tapping the Full (cap) tile", async () => {
      const { user } = renderSelector(account, transaction);

      await user.press(screen.getByText("Full"));

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
      const updater = mockUpdateTransaction.mock.calls[0][0];
      const result = updater(transaction);
      expect(result.useAllAmount).toBe(true);
      expect((result.amount as BigNumber).toString()).toBe("0");
    });
  });

  describe("with only 6 spendable records", () => {
    const account = makeAccount(sixRecords);
    const transaction = makePrivateTransaction();

    it("enables Fast and Balanced (as send-max), disables Full", () => {
      renderSelector(account, transaction);

      expect(screen.getByText("4 records")).toBeOnTheScreen();
      // Balanced only has 6 of 8 available, and that's all the records there are.
      expect(screen.getByText("6 records")).toBeOnTheScreen();
      expect(screen.getByText("Unavailable")).toBeOnTheScreen();
      expect(screen.getByText("—")).toBeOnTheScreen();
    });

    it("does not call updateTransaction when tapping the disabled Full tile", async () => {
      const { user } = renderSelector(account, transaction);

      await user.press(screen.getByText("Full"));

      expect(mockUpdateTransaction).not.toHaveBeenCalled();
    });

    it("calls updateTransaction with useAllAmount when tapping the Balanced (send-max) tile", async () => {
      const { user } = renderSelector(account, transaction);

      await user.press(screen.getByText("Balanced"));

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
      const updater = mockUpdateTransaction.mock.calls[0][0];
      const result = updater(transaction);
      expect(result.useAllAmount).toBe(true);
    });
  });
});
