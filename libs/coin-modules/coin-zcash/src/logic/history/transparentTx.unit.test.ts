import type { TX } from "@ledgerhq/wallet-btc/index";
import {
  classifyTransparentTx,
  explorerFee,
  spentOutpoints,
  sumValues,
  txDate,
} from "./transparentTx";

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

const output = (address: string, value: string, outputIndex = 0) =>
  ({
    address,
    value,
    output_hash: "cc".repeat(32),
    output_index: outputIndex,
    block_height: 3_000_000,
    rbf: false,
  }) as TX["outputs"][number];

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

describe("sumValues", () => {
  it("sums as decimal, not as float", () => {
    expect(sumValues([{ value: "9007199254740993" }, { value: "1" }]).toString()).toBe(
      "9007199254740994",
    );
  });

  it("sums nothing to zero", () => {
    expect(sumValues([]).toString()).toBe("0");
  });
});

describe("classifyTransparentTx", () => {
  const isOwn = (address: string) => address === OWN;

  it("splits what the owner spent from what came back", () => {
    const participation = classifyTransparentTx(
      tx({
        inputs: [input(OWN, "5000"), input(OTHER, "1000", 1)],
        outputs: [output(OTHER, "3000"), output(OWN, "1800", 1)],
      }),
      isOwn,
    );

    expect(participation.spent.toString()).toBe("5000");
    expect(participation.returned.toString()).toBe("1800");
    expect(participation.ownInputs).toHaveLength(1);
    expect(participation.ownOutputs).toHaveLength(1);
  });

  it("reports senders and recipients without duplicates, in transaction order", () => {
    const participation = classifyTransparentTx(
      tx({
        inputs: [input(OTHER, "1000"), input(OTHER, "2000", 1)],
        outputs: [output(OWN, "1500"), output(OWN, "1400", 1)],
      }),
      isOwn,
    );

    expect(participation.senders).toEqual([OTHER]);
    expect(participation.recipients).toEqual([OWN]);
  });

  it("ignores an input the explorer could not attribute", () => {
    const participation = classifyTransparentTx(
      tx({ inputs: [input(undefined, "5000")], outputs: [output(OWN, "4000")] }),
      isOwn,
    );

    expect(participation.spent.toString()).toBe("0");
    expect(participation.senders).toEqual([]);
  });

  it("drops an output the explorer reports as unknown", () => {
    const participation = classifyTransparentTx(
      tx({ outputs: [output("unknown_2", "4000"), output(OWN, "1000", 1)] }),
      isOwn,
    );

    expect(participation.recipients).toEqual([OWN]);
    expect(participation.returned.toString()).toBe("1000");
  });
});
