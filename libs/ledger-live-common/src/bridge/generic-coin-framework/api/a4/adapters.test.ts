import { adaptBalances, adaptOperations, parseA4Asset } from "./adapters";
import type { A4Balances, A4Operation } from "./client";

const ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

describe("parseA4Asset", () => {
  it("parses native", () => {
    expect(parseA4Asset("native", ADDRESS)).toEqual({ type: "native" });
  });

  it("parses a standard.reference token", () => {
    expect(parseA4Asset(`erc20.${USDT}`, ADDRESS)).toEqual({
      type: "erc20",
      assetReference: USDT,
      assetOwner: ADDRESS,
    });
  });

  it("falls back to the raw id when there is no reference", () => {
    expect(parseA4Asset("weird", ADDRESS)).toEqual({ type: "weird" });
  });
});

describe("adaptBalances", () => {
  it("maps native and token assets to Balance[]", () => {
    const balances: A4Balances = {
      assets: {
        native: { type: "int", value: "100000000" },
        [`erc20.${USDT}`]: { type: "int", value: "2300000" },
      },
    };
    expect(adaptBalances(balances, ADDRESS)).toEqual([
      { value: 100000000n, asset: { type: "native" } },
      {
        value: 2300000n,
        asset: { type: "erc20", assetReference: USDT, assetOwner: ADDRESS },
      },
    ]);
  });

  it("handles an empty asset map", () => {
    expect(adaptBalances({ assets: {} }, ADDRESS)).toEqual([]);
  });
});

describe("adaptOperations", () => {
  const baseOp: A4Operation = {
    txId: "0xhash",
    block: { hash: "0xblock", height: 1234567, time: "2024-01-01T00:00:00Z" },
    asset: "native",
    amount: "1000000",
    type: "send",
    fees: "21000",
    feesPayer: ADDRESS,
    senders: [ADDRESS],
    recipients: ["0xpeer"],
  };

  it("maps send -> OUT and carries tx data", () => {
    const [op] = adaptOperations([baseOp], ADDRESS);
    expect(op.type).toBe("OUT");
    expect(op.value).toBe(1000000n);
    expect(op.asset).toEqual({ type: "native" });
    expect(op.tx.hash).toBe("0xhash");
    expect(op.tx.fees).toBe(21000n);
    expect(op.tx.feesPayer).toBe(ADDRESS);
    expect(op.tx.block.height).toBe(1234567);
    expect(op.tx.failed).toBe(false);
    expect(op.details?.ledgerOpType).toBe("OUT");
  });

  it("maps receive -> IN", () => {
    const [op] = adaptOperations([{ ...baseOp, type: "receive" }], ADDRESS);
    expect(op.type).toBe("IN");
  });

  it("passes through LL-style uppercase types and flags failure/internal", () => {
    const [op] = adaptOperations(
      [{ ...baseOp, type: "FEES", failed: true, internal: true }],
      ADDRESS,
    );
    expect(op.type).toBe("FEES");
    expect(op.tx.failed).toBe(true);
    expect(op.details?.internal).toBe(true);
  });

  it("maps unknown types to NONE", () => {
    const [op] = adaptOperations([{ ...baseOp, type: "vote" }], ADDRESS);
    expect(op.type).toBe("NONE");
  });
});
