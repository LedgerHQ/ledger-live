import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  const valid = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

  it("resolves true for a well-formed erd1 bech32 address", async () => {
    await expect(validateAddress(valid, {})).resolves.toBe(true);
  });

  it("resolves false for a non-erd1 / malformed address", async () => {
    for (const addr of [
      "",
      "not-an-address",
      "erd1short",
      "abc1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      "erd1" + "q".repeat(58),
    ]) {
      await expect(validateAddress(addr, {})).resolves.toBe(false);
    }
  });
});
