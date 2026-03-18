import { BigNumber } from "bignumber.js";
import { Transaction as BitcoinTransaction, address as bitcoinAddress } from "bitcoinjs-lib";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "./buildRbfTransaction";
import { bitcoinPickingStrategy } from "./types";
import wallet, { getWalletAccount } from "./wallet-btc";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import { getMinReplacementFeeRateSatVb } from "./rbfHelpers";

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

jest.mock("./rbfHelpers", () => {
  const actual = jest.requireActual("./rbfHelpers");
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

describe("buildRbfTransaction", () => {
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

  test("buildRbfSpeedUpTx builds a speedup transaction with excluded pending change UTXOs", async () => {
    mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
    mockedFromHex.mockReturnValue({
      ins: [{ sequence: 0xfffffffd }],
      outs: [
        { script: Buffer.from("01", "hex"), value: 50000 },
        { script: Buffer.from("02", "hex"), value: 1000 },
      ],
    });
    mockedFromOutputScript.mockReturnValueOnce("external-1").mockReturnValueOnce("change-1");

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

    const result = await buildRbfSpeedUpTx({ pendingOperations: [] } as any, "orig-txid");

    expect(result.recipient).toBe("external-1");
    expect(result.amount.isEqualTo(50000)).toBe(true);
    expect(result.feePerByte?.isEqualTo(13)).toBe(true);
    expect(result.feesStrategy).toBe("fast");
    expect(result.replaceTxId).toBe("orig-txid");
    expect(result.rbf).toBe(true);
    expect(result.changeAddress).toBe("change-addr");
    expect(result.utxoStrategy.excludeUTXOs).toEqual([{ hash: "h1", outputIndex: 0 }]);
  });

  test("buildRbfSpeedUpTx throws when original transaction is not RBF-enabled", async () => {
    mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
    mockedFromHex.mockReturnValue({
      ins: [{ sequence: 0xffffffff }],
      outs: [{ script: Buffer.from("01", "hex"), value: 1000 }],
    });
    mockedFromOutputScript.mockReturnValue("external-1");

    await expect(buildRbfSpeedUpTx({} as any, "orig-txid")).rejects.toThrow(
      "Transaction is not RBF-enabled",
    );
  });

  test("buildRbfCancelTx builds a cancel transaction sending to change address", async () => {
    mockExplorer.getTxHex.mockResolvedValue("orig-tx-hex");
    mockedFromHex.mockReturnValue({
      ins: [{ sequence: 0xfffffffd }],
      outs: [{ script: Buffer.from("01", "hex"), value: 1234 }],
    });
    mockedFromOutputScript.mockReturnValue("external-1");
    (getAccountNetworkInfo as any).mockResolvedValue({
      feeItems: {
        items: [{ speed: "fast", feePerByte: new BigNumber(99) }],
      },
    });

    const result = await buildRbfCancelTx({ pendingOperations: [] } as any, "orig-txid");

    expect(result.recipient).toBe("change-addr");
    expect(result.useAllAmount).toBeUndefined();
    expect(result.amount.isEqualTo(1234)).toBe(true);
    expect(result.feesStrategy).toBe("custom");
    expect(result.replaceTxId).toBe("orig-txid");
    expect(result.rbf).toBe(true);
    expect(result.utxoStrategy.strategy).toBe(bitcoinPickingStrategy.OPTIMIZE_SIZE);
  });
});
