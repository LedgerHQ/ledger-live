import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { BitcoinAccount, Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { CryptoCurrency } from "@domain/entity-currency";
import { FeeStrategy } from "@ledgerhq/types-live";
import { useFeesStrategy } from "@ledgerhq/live-common/families/bitcoin/react";
import { track } from "~/renderer/analytics/segment";
import SendAmountFields from "../SendAmountFields";

// The bridge's updateTransaction merges the patch onto the transaction.
// Mocking it also avoids the Suspense boundary that useAccountBridge (React `use`) requires.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

// useFeesStrategy is a pure derivation over transaction.networkInfo; mock it so the
// standard-mode SelectFeeStrategy list is deterministic and independent of network data.
jest.mock("@ledgerhq/live-common/families/bitcoin/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/bitcoin/react"),
  useFeesStrategy: jest.fn(),
}));

const baseAccount = createFixtureAccount();
const satUnit = baseAccount.currency.units[baseAccount.currency.units.length - 1];

const feeStrategies: FeeStrategy[] = [
  { label: "slow", amount: new BigNumber(1), unit: satUnit },
  { label: "medium", amount: new BigNumber(2), unit: satUnit },
];

const buildBitcoinAccount = (overrides: Partial<BitcoinAccount> = {}) =>
  ({ ...baseAccount, ...overrides }) as BitcoinAccount;

const buildZcashAccount = () =>
  ({
    ...baseAccount,
    currency: { ...baseAccount.currency, id: "zcash" } as CryptoCurrency,
  }) as BitcoinAccount;

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    feePerByte: new BigNumber(1),
    networkInfo: {
      family: "bitcoin",
      feeItems: { items: [], defaultFeePerByte: new BigNumber(1) },
    },
    feesStrategy: "medium",
    utxoStrategy: { strategy: 0, excludedUTXOs: [] },
    rbf: false,
    ...overrides,
  }) as Transaction;

const renderFields = ({
  account = buildBitcoinAccount(),
  transaction = buildTransaction(),
  flagEnabled = false,
  onChange = jest.fn(),
  updateTransaction = jest.fn(),
}: {
  account?: BitcoinAccount;
  transaction?: Transaction;
  flagEnabled?: boolean;
  onChange?: jest.Mock;
  updateTransaction?: jest.Mock;
} = {}) =>
  render(
    <SendAmountFields.component
      account={account as never}
      parentAccount={null}
      transaction={transaction as never}
      status={{ errors: {}, warnings: {} } as never}
      onChange={onChange}
      updateTransaction={updateTransaction}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }) },
  );

describe("bitcoin SendAmountFields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFeesStrategy).mockReturnValue(feeStrategies);
  });

  describe("fee mode branches", () => {
    it("should render the standard fee strategy list when a preset strategy is selected", () => {
      renderFields({ transaction: buildTransaction({ feesStrategy: "medium" }) });

      expect(screen.getByTestId("send-fee-mode")).toBeVisible();
      // Standard branch renders SelectFeeStrategy, not the advanced FeesField input.
      expect(screen.queryByTestId("currency-textbox")).not.toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeVisible();
      expect(screen.getByText("Slow")).toBeVisible();
    });

    it("should render advanced mode when the custom fee strategy is selected", () => {
      renderFields({ transaction: buildTransaction({ feesStrategy: "custom" }) });

      expect(screen.getByTestId("send-fee-mode")).toBeVisible();
      expect(screen.getByTestId("currency-textbox")).toBeVisible();
      expect(screen.getByText("Coin control")).toBeVisible();
    });

    it("should render advanced mode when no fee strategy is set", () => {
      renderFields({ transaction: buildTransaction({ feesStrategy: undefined }) });

      expect(screen.getByTestId("currency-textbox")).toBeVisible();
    });
  });

  describe("zcash shielded handling", () => {
    it("should hide the fee mode selector and advanced fields for a zcash account when shielded is enabled", () => {
      renderFields({
        account: buildZcashAccount(),
        transaction: buildTransaction({ feesStrategy: "custom" }),
        flagEnabled: true,
      });

      expect(screen.queryByTestId("send-fee-mode")).not.toBeInTheDocument();
      expect(screen.queryByTestId("currency-textbox")).not.toBeInTheDocument();
    });

    it("should keep the advanced fee controls for a zcash account when shielded is disabled", () => {
      renderFields({
        account: buildZcashAccount(),
        transaction: buildTransaction({ feesStrategy: "custom" }),
        flagEnabled: false,
      });

      expect(screen.getByTestId("send-fee-mode")).toBeVisible();
      expect(screen.getByTestId("currency-textbox")).toBeVisible();
    });
  });

  describe("coin control button", () => {
    it("should disable the coin control button when the account has no UTXOs", () => {
      renderFields({
        account: buildBitcoinAccount({ bitcoinResources: { utxos: [] } as never }),
        transaction: buildTransaction({ feesStrategy: "custom" }),
      });

      expect(screen.getByText("Coin control").closest("button")).toBeDisabled();
    });

    it("should enable the coin control button when the account has UTXOs", () => {
      renderFields({
        account: buildBitcoinAccount({
          bitcoinResources: { utxos: [{ hash: "utxo-1" }] } as never,
        }),
        transaction: buildTransaction({ feesStrategy: "custom" }),
      });

      expect(screen.getByText("Coin control").closest("button")).toBeEnabled();
    });
  });

  describe("interactions", () => {
    it("should track and update the transaction when a fee strategy is clicked", async () => {
      const updateTransaction = jest.fn();
      const { user } = renderFields({
        transaction: buildTransaction({ feesStrategy: "medium" }),
        updateTransaction,
      });

      await user.click(screen.getByText("Slow"));

      expect(track).toHaveBeenCalledWith(
        "button_clicked2",
        expect.objectContaining({ button: "slow", feePerByte: feeStrategies[0].amount }),
      );
      expect(updateTransaction).toHaveBeenCalledTimes(1);
    });

    it("should switch to advanced mode and track when the advanced selector is clicked", async () => {
      const { user } = renderFields({ transaction: buildTransaction({ feesStrategy: "medium" }) });

      expect(screen.queryByTestId("currency-textbox")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("advanced-fee-mode-selector"));

      await waitFor(() => expect(screen.getByTestId("currency-textbox")).toBeVisible());
      expect(track).toHaveBeenCalledWith(
        "button_clicked2",
        expect.objectContaining({ button: "advanced" }),
      );
    });

    it("should switch back to standard mode and track when the standard selector is clicked", async () => {
      const { user } = renderFields({ transaction: buildTransaction({ feesStrategy: "custom" }) });

      expect(screen.getByTestId("currency-textbox")).toBeVisible();

      await user.click(screen.getByTestId("standard-fee-mode-selector"));

      await waitFor(() => expect(screen.queryByTestId("currency-textbox")).not.toBeInTheDocument());
      expect(track).toHaveBeenCalledWith(
        "button_clicked2",
        expect.objectContaining({ button: "standard" }),
      );
    });
  });
});
