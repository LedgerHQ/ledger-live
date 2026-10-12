import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import extensions from "./bridgeExtensions";
import { getEditTransactionStatus, isStrategyDisabled } from "./editTransaction";
import type { BitcoinAccount, Transaction, TransactionStatus } from "./types";

jest.mock("./editTransaction", () => ({
  getEditTransactionPatch: jest.fn(),
  getEditTransactionStatus: jest.fn(),
  getFormattedFeeFields: jest.fn(),
  hasMinimumFundsToCancel: jest.fn(),
  hasMinimumFundsToSpeedUp: jest.fn(),
  isStrategyDisabled: jest.fn(),
  isTransactionConfirmed: jest.fn(),
}));

const account = (currencyId: string) => ({ currency: { id: currencyId } }) as unknown as Account;

describe("bitcoin bridge extensions", () => {
  describe("getEstimationRecipient", () => {
    it.each([
      ["bitcoin", "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs"],
      ["litecoin", "LUWPbpM43E2p7ZSh8cyTBEkvpHmr3cB8Ez"],
    ])("returns the fee estimation recipient of %s", (currencyId, recipient) => {
      expect(extensions.getEstimationRecipient?.(account(currencyId))).toBe(recipient);
    });

    it("throws for a currency without estimation recipient", () => {
      expect(() => extensions.getEstimationRecipient?.(account("ethereum"))).toThrow(
        "No estimation recipient for ethereum",
      );
    });
  });

  it("clears an account, its bitcoin resources included", () => {
    const anAccount = {
      type: "Account",
      blockHeight: 800000,
      operations: [{ id: "op" }],
      pendingOperations: [{ id: "pending" }],
      bitcoinResources: { utxos: [{ hash: "txid" }], accountState: { version: 1 } },
    } as unknown as BitcoinAccount;

    const cleared = extensions.clearAccount?.(anAccount) as BitcoinAccount;

    expect(cleared).not.toBe(anAccount);
    expect(cleared.bitcoinResources).toEqual({ utxos: [] });
    expect(cleared.operations).toEqual([]);
    expect(cleared.pendingOperations).toEqual([]);
    expect(cleared.blockHeight).toBe(0);
  });

  it("delegates the edit transaction status, typed as a bitcoin status", () => {
    const status = { errors: {}, warnings: {} } as TransactionStatus;
    const args = {
      account: account("bitcoin"),
      editingOperation: {},
      status,
      transaction: {},
      editType: "speedup",
    } as never;
    jest.mocked(getEditTransactionStatus).mockReturnValue({ errors: {}, warnings: {} } as never);

    extensions.getEditTransactionStatus?.(args);

    expect(getEditTransactionStatus).toHaveBeenCalledWith({ ...(args as object), status });
  });

  it("passes the fee data as the strategy to isStrategyDisabled", () => {
    const transaction = { family: "bitcoin" } as Transaction;
    const feeData = new BigNumber(12);
    jest.mocked(isStrategyDisabled).mockReturnValue(true);

    const disabled = extensions.isStrategyDisabled?.({
      transaction,
      feeData,
    } as never);

    expect(disabled).toBe(true);
    expect(isStrategyDisabled).toHaveBeenCalledWith({ transaction, feesStrategy: feeData });
  });
});
