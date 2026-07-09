import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction as BtcTransaction } from "@ledgerhq/coin-bitcoin/types";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/wallet-btc/getWalletAccount";
import { getOriginalTxFeeContext } from "@ledgerhq/coin-bitcoin/rbfFees";
import { getAdditionalFeeRequiredForRbf, getOriginalTxFeeRateSatVb } from "./rbfValidation";

jest.mock("@ledgerhq/coin-bitcoin/wallet-btc/getWalletAccount", () => ({
  getWalletAccount: jest.fn(),
}));

jest.mock("@ledgerhq/coin-bitcoin/rbfFees", () => ({
  getOriginalTxFeeContext: jest.fn(),
}));

const mockedGetWalletAccount = getWalletAccount as jest.Mock;
const mockedGetOriginalTxFeeContext = getOriginalTxFeeContext as jest.Mock;

const walletAccount = { xpub: { explorer: {} } } as any;

describe("rbfValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetWalletAccount.mockReturnValue(walletAccount);
  });

  describe("getAdditionalFeeRequiredForRbf", () => {
    it("returns zero when replaceTxId is not provided", async () => {
      const result = await getAdditionalFeeRequiredForRbf({
        mainAccount: {} as Account,
        transactionToUpdate: {} as BtcTransaction,
      });

      expect(result.toNumber()).toBe(0);
      expect(mockedGetWalletAccount).not.toHaveBeenCalled();
      expect(mockedGetOriginalTxFeeContext).not.toHaveBeenCalled();
    });

    it("returns zero when the original transaction has no fee context (not RBF enabled)", async () => {
      mockedGetOriginalTxFeeContext.mockResolvedValue(null);

      const result = await getAdditionalFeeRequiredForRbf({
        mainAccount: {} as Account,
        transactionToUpdate: { replaceTxId: "orig-txid" } as BtcTransaction,
      });

      expect(result.toNumber()).toBe(0);
      expect(mockedGetOriginalTxFeeContext).toHaveBeenCalledWith(walletAccount, "orig-txid");
    });

    it("computes additional fee according to RBF policy", async () => {
      // oldFeeSat=1000, vsize=100, oldFeeRate=10, incrementalFeeRate=2
      // minNewFeeFromAbsolute = 1000 + ceil(2 * 100) = 1200
      // minNewFeeFromRate     = (10 + 2) * 100        = 1200
      // additional            = max(1200 - 1000, 0)   = 200
      mockedGetOriginalTxFeeContext.mockResolvedValue({
        vsize: 100,
        oldFeeSat: new BigNumber(1000),
        oldFeeRateSatVb: new BigNumber(10),
        incrementalFeeRateSatVb: new BigNumber(2),
      });

      const result = await getAdditionalFeeRequiredForRbf({
        mainAccount: {} as Account,
        transactionToUpdate: { replaceTxId: "orig-txid" } as BtcTransaction,
      });

      expect(result.toNumber()).toBe(200);
      expect(mockedGetOriginalTxFeeContext).toHaveBeenCalledWith(walletAccount, "orig-txid");
    });
  });

  describe("getOriginalTxFeeRateSatVb", () => {
    it("returns the original tx fee rate from the fee context", async () => {
      mockedGetOriginalTxFeeContext.mockResolvedValue({
        oldFeeRateSatVb: new BigNumber(10),
      });

      const result = await getOriginalTxFeeRateSatVb({} as Account, "orig-txid");

      expect(result?.toNumber()).toBe(10);
      expect(mockedGetOriginalTxFeeContext).toHaveBeenCalledWith(walletAccount, "orig-txid");
    });

    it("returns null when there is no fee context", async () => {
      mockedGetOriginalTxFeeContext.mockResolvedValue(null);

      const result = await getOriginalTxFeeRateSatVb({} as Account, "orig-txid");

      expect(result).toBeNull();
    });

    it("returns null when resolving the fee context throws", async () => {
      mockedGetOriginalTxFeeContext.mockRejectedValue(new Error("network error"));

      const result = await getOriginalTxFeeRateSatVb({} as Account, "orig-txid");

      expect(result).toBeNull();
    });
  });
});
