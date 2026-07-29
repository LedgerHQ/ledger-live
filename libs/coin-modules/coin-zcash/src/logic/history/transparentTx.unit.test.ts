import type { TX } from "@ledgerhq/wallet-btc/index";
import { explorerFee, spentOutpoints, txDate } from "./transparentTx";

const OWN = "t1OwnAddress";
const OTHER = "t1OtherAddress";
const PREV = "ab".repeat(32);

function tx(overrides: Partial<TX> = {}): TX {
  return {
    id: "cc".repeat(32),
    account: 0,
    index: 0,
    received_at: "2026-01-02T03:04:05Z",
    block: { height: 3_000_000, hash: "dd".repeat(32), time: "2026-01-02T04:00:00Z" },
    address: OWN,
    inputs: [],
    outputs: [],
    ...overrides,
  } as TX;
}

const input = (address: string | undefined, value: string, outputIndex = 0) =>
  ({
    address,
    value,
    output_hash: PREV,
    output_index: outputIndex,
    sequence: 0xfffffffe,
  }) as TX["inputs"][number];

describe("spentOutpoints", () => {
  it("lists the outpoints spent, in `${txid}-${index}` form", () => {
    expect(spentOutpoints(tx({ inputs: [input(OWN, "10", 0), input(OTHER, "20", 3)] }))).toEqual([
      `${PREV}-0`,
      `${PREV}-3`,
    ]);
  });

  it("skips an input referencing no outpoint (coinbase)", () => {
    const coinbase = { value: "100", output_index: 0, sequence: 0 } as TX["inputs"][number];

    expect(spentOutpoints(tx({ inputs: [coinbase] }))).toEqual([]);
  });
});

describe("explorerFee", () => {
  it("reads the reported fee", () => {
    expect(explorerFee(tx({ fees: 1000 })).toString()).toBe("1000");
  });

  it("reads zero when the explorer reports none", () => {
    expect(explorerFee(tx()).toString()).toBe("0");
  });
});

describe("txDate", () => {
  it("uses the block time once confirmed", () => {
    expect(txDate(tx()).toISOString()).toBe("2026-01-02T04:00:00.000Z");
  });

  it("falls back to the reception time when unconfirmed", () => {
    expect(txDate(tx({ block: null })).toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });
});
