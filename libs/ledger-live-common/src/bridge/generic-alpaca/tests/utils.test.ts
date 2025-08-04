import { extractBalance } from "../utils";

describe("Alpaca utils", () => {
  describe("extractBalance", () => {
    it("extracts an existing balance", () => {
      expect(
        extractBalance([{ value: 4n, asset: { type: "type1" }, spendableBalance: 4n }], "type1"),
      ).toEqual({
        value: 4n,
        asset: { type: "type1" },
        spendableBalance: 4n,
      });
    });

    it("generates an empty balance for a missing type", () => {
      expect(
        extractBalance([{ value: 4n, asset: { type: "type1" }, spendableBalance: 4n }], "type2"),
      ).toEqual({
        value: 0n,
        asset: { type: "type2" },
        spendableBalance: 4n,
      });
    });
  });
});
