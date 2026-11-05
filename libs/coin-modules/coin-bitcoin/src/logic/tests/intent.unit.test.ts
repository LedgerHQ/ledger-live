import { InvalidUtxoId, InvalidUtxoStrategy } from "../../errors";
import type { BitcoinIntent } from "../intent";
import { coinControlOf } from "../intent";

const HASH = "ab".repeat(32);
const OTHER = "cd".repeat(32);

const intent = (utxoStrategy?: NonNullable<BitcoinIntent["data"]>["utxoStrategy"]): BitcoinIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: "sender",
    recipient: "recipient",
    amount: 1n,
    asset: { type: "native" },
    ...(utxoStrategy ? { data: { type: "unknown", utxoStrategy } } : {}),
  }) as BitcoinIntent;

describe("coinControlOf", () => {
  it("defaults to deepest first, without selection nor exclusion", () => {
    expect(coinControlOf(intent())).toEqual({
      strategy: "deep-outputs-first",
      selected: [],
      excluded: [],
    });
  });

  it("parses the UTXO ids, lowercasing the hash", () => {
    expect(
      coinControlOf(
        intent({
          strategy: "merge-outputs",
          selectedUtxos: [`${HASH.toUpperCase()}:3`],
          excludedUtxos: [`${OTHER}:0`, `${OTHER}:12`],
        }),
      ),
    ).toEqual({
      strategy: "merge-outputs",
      selected: [{ hash: HASH, outputIndex: 3 }],
      excluded: [
        { hash: OTHER, outputIndex: 0 },
        { hash: OTHER, outputIndex: 12 },
      ],
    });
  });

  it.each([
    ["a short hash", `${"ab".repeat(31)}:0`],
    ["a hash that is not hex", `${"zz".repeat(32)}:0`],
    ["a missing separator", HASH],
    ["a missing index", `${HASH}:`],
    ["a negative index", `${HASH}:-1`],
    ["a non-integer index", `${HASH}:1.5`],
    ["an index with a leading zero", `${HASH}:01`],
    ["an index beyond the safe integers", `${HASH}:99999999999999999999`],
  ])("rejects %s", (_label, id) => {
    expect(() => coinControlOf(intent({ selectedUtxos: [id] }))).toThrow(InvalidUtxoId);
    expect(() => coinControlOf(intent({ excludedUtxos: [id] }))).toThrow(InvalidUtxoId);
  });

  it("rejects ids that are not a list of strings", () => {
    expect(() =>
      coinControlOf(intent({ selectedUtxos: `${HASH}:0` as unknown as string[] })),
    ).toThrow(InvalidUtxoId);
    expect(() => coinControlOf(intent({ selectedUtxos: [7 as unknown as string] }))).toThrow(
      InvalidUtxoId,
    );
  });

  it("rejects an id both selected and excluded, naming it", () => {
    expect(() =>
      coinControlOf(intent({ selectedUtxos: [`${HASH}:1`], excludedUtxos: [`${HASH}:1`] })),
    ).toThrow(expect.objectContaining({ name: "InvalidUtxoId", utxoId: `${HASH}:1` }));
  });

  it("rejects an id listed twice, in either list, naming it", () => {
    const twice = [`${HASH}:1`, `${HASH.toUpperCase()}:1`];
    for (const utxoStrategy of [{ selectedUtxos: twice }, { excludedUtxos: twice }]) {
      expect(() => coinControlOf(intent(utxoStrategy))).toThrow(
        expect.objectContaining({
          name: "InvalidUtxoId",
          utxoId: `${HASH}:1`,
          message: expect.stringContaining(`${HASH}:1`),
        }),
      );
    }
  });

  it("rejects an unknown strategy", () => {
    expect(() =>
      coinControlOf(intent({ strategy: "random" as unknown as "merge-outputs" })),
    ).toThrow(InvalidUtxoStrategy);
  });
});
