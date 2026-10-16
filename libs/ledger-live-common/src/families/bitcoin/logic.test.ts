import { BigNumber } from "bignumber.js";
import { getUTXOStatus } from "./logic";
import { defaultUtxoStrategy, type BitcoinOutput, type UtxoStrategy } from "./types";

const output = (overrides: Partial<BitcoinOutput> = {}): BitcoinOutput => ({
  hash: "txid",
  outputIndex: 0,
  blockHeight: 100,
  address: "bc1qaddress",
  value: new BigNumber(1000),
  rbf: false,
  isChange: false,
  ...overrides,
});

const excluding = (...utxos: UtxoStrategy["excludeUTXOs"]): UtxoStrategy => ({
  ...defaultUtxoStrategy(),
  excludeUTXOs: utxos,
});

describe("getUTXOStatus", () => {
  it("lets coin selection pick a confirmed output", () => {
    expect(getUTXOStatus(output(), defaultUtxoStrategy())).toEqual({ excluded: false });
  });

  it.each([null, undefined, 0])(
    "excludes a pending output that is not change (block height %s)",
    blockHeight => {
      expect(getUTXOStatus(output({ blockHeight }), defaultUtxoStrategy())).toEqual({
        excluded: true,
        reason: "pickPendingUtxo",
      });
    },
  );

  it("lets coin selection pick a pending change output", () => {
    expect(
      getUTXOStatus(output({ blockHeight: null, isChange: true }), defaultUtxoStrategy()),
    ).toEqual({ excluded: false });
  });

  it("excludes an output the user excluded", () => {
    expect(getUTXOStatus(output(), excluding({ hash: "txid", outputIndex: 0 }))).toEqual({
      excluded: true,
      reason: "userExclusion",
    });
  });

  it("reports a pending output that is not change as pending, even when excluded", () => {
    expect(
      getUTXOStatus(output({ blockHeight: null }), excluding({ hash: "txid", outputIndex: 0 })),
    ).toEqual({ excluded: true, reason: "pickPendingUtxo" });
  });

  it("matches exclusions on both the hash and the output index", () => {
    const strategy = excluding({ hash: "txid", outputIndex: 1 }, { hash: "other", outputIndex: 0 });
    expect(getUTXOStatus(output(), strategy)).toEqual({ excluded: false });
  });
});
