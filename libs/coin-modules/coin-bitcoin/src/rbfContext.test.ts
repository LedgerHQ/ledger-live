import { BigNumber } from "bignumber.js";
import { Transaction as BitcoinTransaction, address as bitcoinAddress } from "bitcoinjs-lib";
import { getAmountAndRecipient, getRbfContext } from "./rbfContext";
import wallet, { getWalletAccount } from "./wallet-btc";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import { getMinReplacementFeeRateSatVb } from "./rbfFees";

jest.mock("bitcoinjs-lib", () => ({
  Transaction: {
    fromHex: jest.fn(),
  },
  address: {
    fromOutputScript: jest.fn(),
  },
}));

jest.mock("./wallet-btc", () => ({
  __esModule: true,
  default: {
    getAccountUnspentUtxos: jest.fn(),
  },
  getWalletAccount: jest.fn(),
}));

jest.mock("./getAccountNetworkInfo", () => ({
  __esModule: true,
  getAccountNetworkInfo: jest.fn(),
}));

jest.mock("./rbfFees", () => {
  const actual = jest.requireActual("./rbfFees");
  return {
    __esModule: true,
    ...actual,
    getMinReplacementFeeRateSatVb: jest.fn(),
  };
});

type MockExplorer = {
  getTxHex: any;
};

const mockedFromHex = (BitcoinTransaction as any).fromHex;
const mockedFromOutputScript = (bitcoinAddress as any).fromOutputScript;

describe("rbfContext helpers", () => {
  let mockExplorer: MockExplorer;
  let mockWalletAccount: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockExplorer = {
      getTxHex: jest.fn(),
    };

    mockWalletAccount = {
      xpub: {
        explorer: mockExplorer,
        storage: {
          getUniquesAddresses: jest.fn(({ account }: { account: number }) => {
            if (account === 0) {
              return [{ address: "recv-1" }];
            }
            return [{ address: "change-1" }];
          }),
        },
        crypto: {
          network: { name: "regtest" },
        },
        getNewAddress: jest.fn().mockResolvedValue({ address: "change-addr" }),
      },
    };

    (getWalletAccount as any).mockReturnValue(mockWalletAccount);
    (getAccountNetworkInfo as any).mockResolvedValue({
      feeItems: {
        items: [{ speed: "fast", feePerByte: new BigNumber(13) }],
      },
    });
    (getMinReplacementFeeRateSatVb as any).mockResolvedValue(new BigNumber(12.3));
  });

  describe("getRbfContext", () => {
    test("returns the rbf context with a ceil'd feePerByte and pending change UTXOs excluded", async () => {
      mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
      mockedFromHex.mockReturnValue({
        ins: [{ sequence: 0xfffffffd }],
        outs: [{ script: Buffer.from("01", "hex"), value: 50000 }],
      });

      (wallet.getAccountUnspentUtxos as any).mockResolvedValue([
        {
          output_hash: "h1",
          output_index: 0,
          block_height: null,
          address: "change-1",
          value: "1000",
          rbf: true,
        },
        {
          output_hash: "h2",
          output_index: 1,
          block_height: 100,
          address: "recv-1",
          value: "2000",
          rbf: false,
        },
      ]);

      const ctx = await getRbfContext({} as any, "orig-txid");

      expect(ctx.feePerByte.isEqualTo(13)).toBe(true);
      expect(ctx.changeAddress.address).toBe("change-addr");
      expect(ctx.excludeUTXOs).toEqual([{ hash: "h1", outputIndex: 0 }]);
      expect(ctx.networkInfo).toEqual({
        feeItems: {
          items: [{ speed: "fast", feePerByte: new BigNumber(13) }],
        },
      });
    });

    test("throws when original transaction is not RBF-enabled", async () => {
      mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
      mockedFromHex.mockReturnValue({
        ins: [{ sequence: 0xffffffff }],
        outs: [{ script: Buffer.from("01", "hex"), value: 1000 }],
      });

      await expect(getRbfContext({} as any, "orig-txid")).rejects.toThrow(
        "Transaction is not RBF-enabled",
      );
    });
  });

  describe("getAmountAndRecipient", () => {
    test("resolves the external recipient and amount from the tx outputs", async () => {
      mockedFromOutputScript.mockReturnValueOnce("external-1").mockReturnValueOnce("change-1");

      const tx = {
        outs: [
          { script: Buffer.from("01", "hex"), value: 50000 },
          { script: Buffer.from("02", "hex"), value: 1000 },
        ],
      };

      const { amountSent, recipient } = await getAmountAndRecipient(tx as any, mockWalletAccount);

      expect(recipient).toBe("external-1");
      expect(amountSent).toBe(50000);
    });

    test("uses the known recipient when provided", async () => {
      mockedFromOutputScript.mockReturnValue("known-recipient");

      const tx = {
        outs: [{ script: Buffer.from("01", "hex"), value: 1234 }],
      };

      const { amountSent, recipient } = await getAmountAndRecipient(
        tx as any,
        mockWalletAccount,
        "known-recipient",
      );

      expect(recipient).toBe("known-recipient");
      expect(amountSent).toBe(1234);
    });
  });
});
