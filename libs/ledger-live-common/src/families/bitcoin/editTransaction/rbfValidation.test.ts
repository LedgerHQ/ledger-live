import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "../types";
import { getReplacementEstimate } from "./replacement";
import { getAdditionalFeeRequiredForRbf, getOriginalTxFeeRateSatVb } from "./rbfValidation";

jest.mock("./replacement", () => ({
  getReplacementEstimate: jest.fn(),
}));

const mockedGetReplacementEstimate = getReplacementEstimate as jest.Mock;

const mainAccount = { id: "btc-account" } as Account;
const toUpdate = (familySpecificData?: BtcTransaction["familySpecificData"]) =>
  ({ family: "bitcoin", ...(familySpecificData ? { familySpecificData } : {}) }) as BtcTransaction;

describe("rbfValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAdditionalFeeRequiredForRbf", () => {
    it.each([
      ["there is no familySpecificData", toUpdate()],
      ["replaceTxId is not provided", toUpdate({ rbf: true })],
      ["replaceTxId is empty", toUpdate({ replaceTxId: "" })],
    ])("returns zero without estimating when %s", async (_, transactionToUpdate) => {
      const result = await getAdditionalFeeRequiredForRbf({ mainAccount, transactionToUpdate });

      expect(result.toNumber()).toBe(0);
      expect(mockedGetReplacementEstimate).not.toHaveBeenCalled();
    });

    it.each([
      ["the minimum replacement fee", { originalFee: 1000n }],
      ["the original fee", { minReplacementFee: 1200n }],
      ["both fees", {}],
    ])("returns zero when the estimation does not know %s", async (_, parameters) => {
      mockedGetReplacementEstimate.mockResolvedValue(parameters);

      const result = await getAdditionalFeeRequiredForRbf({
        mainAccount,
        transactionToUpdate: toUpdate({ replaceTxId: "orig-txid" }),
      });

      expect(result.toNumber()).toBe(0);
      expect(mockedGetReplacementEstimate).toHaveBeenCalledWith(mainAccount, "orig-txid");
    });

    it("returns what the replacement pays on top of the original fee", async () => {
      // the coin module applies the RBF policy: minReplacementFee = 1200 for an original fee of 1000
      mockedGetReplacementEstimate.mockResolvedValue({
        minReplacementFee: 1200n,
        originalFee: 1000n,
      });

      const result = await getAdditionalFeeRequiredForRbf({
        mainAccount,
        transactionToUpdate: toUpdate({ replaceTxId: "orig-txid", rbf: true }),
      });

      expect(result.toNumber()).toBe(200);
      expect(mockedGetReplacementEstimate).toHaveBeenCalledWith(mainAccount, "orig-txid");
    });

    it("never returns a negative fee", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({
        minReplacementFee: 900n,
        originalFee: 1000n,
      });

      const result = await getAdditionalFeeRequiredForRbf({
        mainAccount,
        transactionToUpdate: toUpdate({ replaceTxId: "orig-txid" }),
      });

      expect(result.toNumber()).toBe(0);
    });

    it("propagates a failed estimation", async () => {
      mockedGetReplacementEstimate.mockRejectedValue(new Error("network error"));

      await expect(
        getAdditionalFeeRequiredForRbf({
          mainAccount,
          transactionToUpdate: toUpdate({ replaceTxId: "orig-txid" }),
        }),
      ).rejects.toThrow("network error");
    });
  });

  describe("getOriginalTxFeeRateSatVb", () => {
    it("returns the original transaction fee rate of the replacement estimation", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({ originalFeePerByte: 10n });

      const result = await getOriginalTxFeeRateSatVb(mainAccount, "orig-txid");

      expect(result?.toNumber()).toBe(10);
      expect(mockedGetReplacementEstimate).toHaveBeenCalledWith(mainAccount, "orig-txid");
    });

    it("returns zero rates as such", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({ originalFeePerByte: 0n });

      const result = await getOriginalTxFeeRateSatVb(mainAccount, "orig-txid");

      expect(result?.toNumber()).toBe(0);
    });

    it("returns null when the estimation has no original rate", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({});

      const result = await getOriginalTxFeeRateSatVb(mainAccount, "orig-txid");

      expect(result).toBeNull();
    });

    it("returns null when the estimation throws", async () => {
      mockedGetReplacementEstimate.mockRejectedValue(new Error("network error"));

      const result = await getOriginalTxFeeRateSatVb(mainAccount, "orig-txid");

      expect(result).toBeNull();
    });
  });
});
