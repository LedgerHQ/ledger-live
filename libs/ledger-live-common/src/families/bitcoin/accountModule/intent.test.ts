import { REPLACE_CANCEL, REPLACE_SPEEDUP } from "@ledgerhq/coin-bitcoin/api";
import { accountOptions, computeIntentType } from "./intent";

describe("computeIntentType", () => {
  it("is a send, a speed up, or a cancel paying the account back", () => {
    expect(computeIntentType({})).toBe("send");
    expect(computeIntentType({ familySpecificData: { replaceTxId: "t" } })).toBe(REPLACE_SPEEDUP);
    expect(
      computeIntentType({
        recipient: "change",
        familySpecificData: { replaceTxId: "t", changeAddress: "change" },
      }),
    ).toBe(REPLACE_CANCEL);
    expect(
      computeIntentType({
        recipient: "elsewhere",
        familySpecificData: { replaceTxId: "t", changeAddress: "change" },
      }),
    ).toBe(REPLACE_SPEEDUP);
  });
});

describe("accountOptions", () => {
  it("hands the coin control and the replaced transaction to the account module", () => {
    expect(
      accountOptions({
        familySpecificData: {
          utxoStrategy: { strategy: 2, excludeUTXOs: [{ hash: "a", outputIndex: 1 }] },
          replaceTxId: "t",
        },
      }),
    ).toEqual({ strategy: 2, excludedUtxos: [{ txid: "a", vout: 1 }], replaceTxId: "t" });
  });

  it("defaults to the deep outputs first strategy without exclusion nor replacement", () => {
    expect(accountOptions({})).toEqual({ strategy: 0, excludedUtxos: [] });
  });
});
