import { maskAccountKey } from "./mask";
import { ETH_ADDR, SOL_ADDR, XPUB } from "./test-fixtures";

describe("maskAccountKey", () => {
  it.each([
    [XPUB, "xpub6B…WNzh"],
    [ETH_ADDR, "0x71C7…976F"],
    [SOL_ADDR, "7xKXtg…gAsU"],
  ])("keeps a short head and tail of %s", (key, masked) => {
    expect(maskAccountKey(key)).toBe(masked);
  });

  it("keeps only the head of a short key", () => {
    expect(maskAccountKey("0.0.1234")).toBe("0.…");
  });

  it("never returns the key itself", () => {
    for (const key of [XPUB, ETH_ADDR, SOL_ADDR, "0.0.1234", "a"]) {
      expect(maskAccountKey(key)).not.toBe(key);
    }
  });
});
