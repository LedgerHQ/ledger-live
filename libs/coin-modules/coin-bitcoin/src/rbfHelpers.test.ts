import { BigNumber } from "bignumber.js";
import { Transaction as BitcoinTransaction } from "bitcoinjs-lib";
import { getWalletAccount } from "./wallet-btc";
import { getIncrementalFeeFloorSatVb } from "./wallet-btc/utils";
import * as rbfHelpers from "./rbfHelpers";

const { getUtxoValue, getAdditionalFeeRequiredForRbf, getMinReplacementFeeRateSatVb } = rbfHelpers;

jest.mock("bitcoinjs-lib", () => ({
  Transaction: {
    fromHex: jest.fn(),
  },
}));
jest.mock("./wallet-btc", () => ({
  getWalletAccount: jest.fn(),
}));

jest.mock("./wallet-btc/utils", () => ({
  getIncrementalFeeFloorSatVb: jest.fn(),
}));

type MockExplorer = {
  getTxHex: jest.Mock<Promise<string>, [string]>;
};

describe("rbfHelpers", () => {
  let mockExplorer: MockExplorer;
  let mockWalletAccount: any;
  const mockedFromHex = (BitcoinTransaction as any).fromHex as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    mockExplorer = {
      getTxHex: jest.fn(),
    };

    mockWalletAccount = {
      xpub: {
        explorer: mockExplorer,
      },
    };

    (getWalletAccount as jest.Mock).mockReturnValue(mockWalletAccount);
  });

  describe("getUtxoValue", () => {
    it("returns the value of the specified output index", () => {
      mockExplorer.getTxHex.mockResolvedValue("tx-hex");
      const txMock = {
        outs: [{ value: 1000 }, { value: 2000 }],
      };
      mockedFromHex.mockReturnValue(txMock);

      return getUtxoValue(mockWalletAccount, "some-txid", 1).then(result => {
        expect(mockExplorer.getTxHex).toHaveBeenCalledWith("some-txid");
        expect(mockedFromHex).toHaveBeenCalledWith("tx-hex");
        expect(result).toBe(2000);
      });
    });

    it("throws if the output index does not exist", () => {
      mockExplorer.getTxHex.mockResolvedValue("tx-hex");
      const txMock = {
        outs: [{ value: 1000 }],
      };
      mockedFromHex.mockReturnValue(txMock);

      return expect(getUtxoValue(mockWalletAccount, "some-txid", 1)).rejects.toThrow(
        "Output index 1 does not exist",
      );
    });
  });

  describe("getAdditionalFeeRequiredForRbf", () => {
    it("returns zero when replaceTxId is not provided", () => {
      return getAdditionalFeeRequiredForRbf({
        mainAccount: {} as any,
        transactionToUpdate: {} as any,
      }).then(result => {
        expect(result.toNumber()).toBe(0);
        expect(getWalletAccount).not.toHaveBeenCalled();
      });
    });

    it("returns zero when original transaction is not RBF enabled", () => {
      mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
      const nonRbfTx = {
        ins: [{ sequence: 0xffffffff }],
        outs: [{ value: 1000 }],
        virtualSize: () => 100,
      };
      mockedFromHex.mockReturnValue(nonRbfTx);
      (getIncrementalFeeFloorSatVb as jest.Mock).mockResolvedValue(new BigNumber(2));

      return getAdditionalFeeRequiredForRbf({
        mainAccount: {} as any,
        transactionToUpdate: { replaceTxId: "orig-txid" } as any,
      }).then(result => {
        expect(result.toNumber()).toBe(0);
        expect(mockExplorer.getTxHex).toHaveBeenCalledWith("orig-txid");
      });
    });

    it("computes additional fee according to RBF policy", () => {
      const vsize = 100;

      const originalTx = {
        ins: [
          {
            sequence: 0, // RBF-enabled
            hash: Uint8Array.from([1, 2, 3]),
            index: 0,
          },
        ],
        outs: [{ value: 1000 }],
        virtualSize: () => vsize,
      };

      // Funding tx for the referenced UTXO: output[0] = 2000 sats
      const utxoFundingTx = {
        outs: [{ value: 2000 }],
      };

      // getTxHex called for:
      // 1) original txid ("orig-txid")
      // 2) prevout txid derived from hash [1,2,3] reversed => "030201"
      mockExplorer.getTxHex.mockImplementation((txid: string) => {
        if (txid === "orig-txid") return Promise.resolve("orig-tx-hex");
        if (txid === "030201") return Promise.resolve("utxo-tx-hex");
        return Promise.resolve("unexpected");
      });

      mockedFromHex
        .mockImplementationOnce(() => originalTx) // fromHex("orig-tx-hex")
        .mockImplementationOnce(() => utxoFundingTx); // fromHex("utxo-tx-hex")

      (getIncrementalFeeFloorSatVb as jest.Mock).mockResolvedValue(new BigNumber(2));

      return getAdditionalFeeRequiredForRbf({
        mainAccount: {} as any,
        transactionToUpdate: { replaceTxId: "orig-txid" } as any,
      }).then(result => {
        expect(result.toNumber()).toBe(200);
        expect(getIncrementalFeeFloorSatVb).toHaveBeenCalledWith(mockExplorer);
        expect(mockExplorer.getTxHex).toHaveBeenCalledWith("orig-txid");
        expect(mockExplorer.getTxHex).toHaveBeenCalledWith("030201");
      });
    });
  });

  describe("getMinReplacementFeeRateSatVb", () => {
    it("computes minimum replacement fee rate according to RBF policy", () => {
      const vsize = 100;

      const originalTx = {
        ins: [
          {
            sequence: 0,
            hash: Uint8Array.from([1, 2, 3]),
            index: 0,
          },
        ],
        outs: [{ value: 1000 }],
        virtualSize: () => vsize,
      };

      const utxoFundingTx = {
        outs: [{ value: 2000 }],
      };

      mockExplorer.getTxHex.mockImplementation((txid: string) => {
        if (txid === "orig-txid") return Promise.resolve("orig-tx-hex");
        if (txid === "030201") return Promise.resolve("utxo-tx-hex");
        return Promise.resolve("unexpected");
      });

      mockedFromHex
        .mockImplementationOnce(() => originalTx)
        .mockImplementationOnce(() => utxoFundingTx);

      (getIncrementalFeeFloorSatVb as jest.Mock).mockResolvedValue(new BigNumber(2));

      return getMinReplacementFeeRateSatVb({
        account: {} as any,
        originalTxId: "orig-txid",
      }).then(result => {
        expect(result.toNumber()).toBe(12);
        expect(getIncrementalFeeFloorSatVb).toHaveBeenCalledWith(mockExplorer);
        expect(mockExplorer.getTxHex).toHaveBeenCalledWith("orig-txid");
        expect(mockExplorer.getTxHex).toHaveBeenCalledWith("030201");
      });
    });

    it("returns at least old fee rate + 1 when incremental relay fee is 0 (RBF requires strictly greater)", () => {
      const vsize = 100;
      const originalTx = {
        ins: [
          {
            sequence: 0,
            hash: Uint8Array.from([1, 2, 3]),
            index: 0,
          },
        ],
        outs: [{ value: 1000 }],
        virtualSize: () => vsize,
      };
      const utxoFundingTx = { outs: [{ value: 2000 }] };

      mockExplorer.getTxHex.mockImplementation((txid: string) => {
        if (txid === "orig-txid") return Promise.resolve("orig-tx-hex");
        if (txid === "030201") return Promise.resolve("utxo-tx-hex");
        return Promise.resolve("unexpected");
      });

      mockedFromHex
        .mockImplementationOnce(() => originalTx)
        .mockImplementationOnce(() => utxoFundingTx);

      (getIncrementalFeeFloorSatVb as jest.Mock).mockResolvedValue(new BigNumber(0));

      return getMinReplacementFeeRateSatVb({
        account: {} as any,
        originalTxId: "orig-txid",
      }).then(result => {
        expect(result.toNumber()).toBe(11);
      });
    });

    it("returns zero when original tx is not RBF enabled", () => {
      mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
      const nonRbfTx = {
        ins: [{ sequence: 0xffffffff }],
        outs: [{ value: 1000 }],
        virtualSize: () => 100,
      };
      mockedFromHex.mockReturnValue(nonRbfTx);
      (getIncrementalFeeFloorSatVb as jest.Mock).mockResolvedValue(new BigNumber(2));

      return getMinReplacementFeeRateSatVb({
        account: {} as any,
        originalTxId: "orig-txid",
      }).then(result => {
        expect(result.toNumber()).toBe(0);
      });
    });
  });
});
