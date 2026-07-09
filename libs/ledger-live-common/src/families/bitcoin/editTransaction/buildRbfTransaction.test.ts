import { BigNumber } from "bignumber.js";
import { getAmountAndRecipient, getRbfContext } from "@ledgerhq/coin-bitcoin/rbfContext";
import { bitcoinPickingStrategy } from "@ledgerhq/coin-bitcoin/types";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "./buildRbfTransaction";

jest.mock("@ledgerhq/coin-bitcoin/rbfContext", () => ({
  getRbfContext: jest.fn(),
  getAmountAndRecipient: jest.fn(),
}));

const mockedGetRbfContext = getRbfContext as jest.Mock;
const mockedGetAmountAndRecipient = getAmountAndRecipient as jest.Mock;

const baseContext = () => ({
  walletAccount: {},
  originalTx: { outs: [{ value: 50000 }] },
  feePerByte: new BigNumber(13),
  networkInfo: {
    feeItems: {
      items: [{ speed: "fast", feePerByte: new BigNumber(13) }],
    },
  },
  changeAddress: { address: "change-addr" },
  excludeUTXOs: [{ hash: "h1", outputIndex: 0 }],
});

describe("buildRbfTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetRbfContext.mockResolvedValue(baseContext());
    mockedGetAmountAndRecipient.mockResolvedValue({ amountSent: 50000, recipient: "external-1" });
  });

  describe("buildRbfSpeedUpTx", () => {
    test("builds a speedup transaction keeping recipient, amount and excluded UTXOs", async () => {
      const result = await buildRbfSpeedUpTx({ pendingOperations: [] } as any, "orig-txid");

      expect(result.recipient).toBe("external-1");
      expect(result.amount.isEqualTo(50000)).toBe(true);
      expect(result.feePerByte?.isEqualTo(13)).toBe(true);
      expect(result.feesStrategy).toBe("fast");
      expect(result.replaceTxId).toBe("orig-txid");
      expect(result.rbf).toBe(true);
      expect(result.changeAddress).toBe("change-addr");
      expect(result.utxoStrategy.strategy).toBe(bitcoinPickingStrategy.OPTIMIZE_SIZE);
      expect(result.utxoStrategy.excludeUTXOs).toEqual([{ hash: "h1", outputIndex: 0 }]);
    });

    test("passes the pending operation recipient to getAmountAndRecipient", async () => {
      const account = {
        pendingOperations: [{ hash: "orig-txid", recipients: ["known-recipient"] }],
      };

      await buildRbfSpeedUpTx(account as any, "orig-txid");

      expect(mockedGetAmountAndRecipient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "known-recipient",
      );
    });

    test("falls back to a custom fees strategy when feePerByte differs from the fast fee", async () => {
      mockedGetRbfContext.mockResolvedValue({
        ...baseContext(),
        networkInfo: {
          feeItems: {
            items: [{ speed: "fast", feePerByte: new BigNumber(99) }],
          },
        },
      });

      const result = await buildRbfSpeedUpTx({ pendingOperations: [] } as any, "orig-txid");

      expect(result.feesStrategy).toBe("custom");
    });
  });

  describe("buildRbfCancelTx", () => {
    test("builds a cancel transaction sending back to the change address", async () => {
      const result = await buildRbfCancelTx({ pendingOperations: [] } as any, "orig-txid");

      expect(result.recipient).toBe("change-addr");
      expect(result.amount.isEqualTo(50000)).toBe(true);
      expect(result.replaceTxId).toBe("orig-txid");
      expect(result.rbf).toBe(true);
      expect(result.utxoStrategy.strategy).toBe(bitcoinPickingStrategy.OPTIMIZE_SIZE);
    });

    test("falls back to the first spendable output amount when none is detected", async () => {
      mockedGetRbfContext.mockResolvedValue({
        ...baseContext(),
        originalTx: { outs: [{ value: 0 }, { value: 4321 }] },
      });
      mockedGetAmountAndRecipient.mockResolvedValue({ amountSent: 0, recipient: "" });

      const result = await buildRbfCancelTx({ pendingOperations: [] } as any, "orig-txid");

      expect(result.amount.isEqualTo(4321)).toBe(true);
    });
  });
});
