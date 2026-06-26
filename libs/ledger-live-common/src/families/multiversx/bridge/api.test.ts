import { computeIntentType } from "./api";

describe("multiversx bridge", () => {
  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
      [{ mode: "delegate" }, "delegate"],
      [{ mode: "unDelegate" }, "unDelegate"],
      [{ mode: "claimRewards" }, "claimRewards"],
      [{ mode: "withdraw" }, "withdraw"],
      [{ mode: "reDelegateRewards" }, "reDelegateRewards"],
    ])("maps %o to %s", (transaction, expected) => {
      expect(computeIntentType(transaction)).toBe(expected);
    });

    it("throws for an unsupported mode", () => {
      expect(() => computeIntentType({ mode: "swap" })).toThrow(
        "Unsupported MultiversX transaction mode: swap",
      );
    });
  });
});
