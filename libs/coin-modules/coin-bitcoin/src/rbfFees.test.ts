import { BigNumber } from "bignumber.js";
import { Transaction as BitcoinTransaction } from "bitcoinjs-lib";
import { getWalletAccount } from "./wallet-btc/getWalletAccount";
import { getIncrementalFeeFloorSatVb } from "./wallet-btc/utils";
import * as rbfFees from "./rbfFees";

const { getUtxoValue, getMinReplacementFeeRateSatVb } = rbfFees;

jest.mock("bitcoinjs-lib", () => ({
  Transaction: {
    fromHex: jest.fn(),
  },
}));

jest.mock("./wallet-btc/getWalletAccount", () => ({
  getWalletAccount: jest.fn(),
}));

jest.mock("./wallet-btc/utils", () => ({
  getIncrementalFeeFloorSatVb: jest.fn(),
}));

type MockExplorer = {
  getTxHex: jest.Mock<Promise<string>, [string]>;
};

describe("rbfFees", () => {
  let mockExplorer: MockExplorer;
  let mockWalletAccount: any;
  const mockedFromHex = (BitcoinTransaction as any).fromHex as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

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
    it("returns the value of the specified output index", async () => {
      mockExplorer.getTxHex.mockResolvedValue("tx-hex");
      const txMock = {
        outs: [{ value: 1000 }, { value: 2000 }],
      };
      mockedFromHex.mockReturnValue(txMock);

      const result = await getUtxoValue(mockWalletAccount, "some-txid", 1);

      expect(mockExplorer.getTxHex).toHaveBeenCalledWith("some-txid");
      expect(mockedFromHex).toHaveBeenCalledWith("tx-hex");
      expect(result).toBe(2000);
    });

    it("throws if the output index does not exist", async () => {
      mockExplorer.getTxHex.mockResolvedValue("tx-hex");
      const txMock = {
        outs: [{ value: 1000 }],
      };
      mockedFromHex.mockReturnValue(txMock);

      await expect(getUtxoValue(mockWalletAccount, "some-txid", 1)).rejects.toThrow(
        "Output index 1 does not exist",
      );
    });
  });

  describe("getMinReplacementFeeRateSatVb", () => {
    it("computes minimum replacement fee rate according to RBF policy", async () => {
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

      const result = await getMinReplacementFeeRateSatVb({
        account: {} as any,
        originalTxId: "orig-txid",
      });
      expect(result.toNumber()).toBe(12);
      expect(getIncrementalFeeFloorSatVb).toHaveBeenCalledWith(mockExplorer, new BigNumber(10));
      expect(mockExplorer.getTxHex).toHaveBeenCalledWith("orig-txid");
      expect(mockExplorer.getTxHex).toHaveBeenCalledWith("030201");
    });

    it("returns at least old fee rate + 1 when incremental relay fee is 0 (RBF requires strictly greater)", async () => {
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

      const result = await getMinReplacementFeeRateSatVb({
        account: {} as any,
        originalTxId: "orig-txid",
      });
      expect(result.toNumber()).toBe(11);
    });

    it("returns zero when original tx is not RBF enabled", async () => {
      mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
      const nonRbfTx = {
        ins: [{ sequence: 0xffffffff }],
        outs: [{ value: 1000 }],
        virtualSize: () => 100,
      };
      mockedFromHex.mockReturnValue(nonRbfTx);
      (getIncrementalFeeFloorSatVb as jest.Mock).mockResolvedValue(new BigNumber(2));

      const result = await getMinReplacementFeeRateSatVb({
        account: {} as any,
        originalTxId: "orig-txid",
      });
      expect(result.toNumber()).toBe(0);
    });
  });
});
