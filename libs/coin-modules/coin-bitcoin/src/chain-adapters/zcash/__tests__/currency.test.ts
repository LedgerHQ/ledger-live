import { getChainAdapter } from "../../registry";
import { defaultAdapter } from "../../default";
import "../index";
import { ZCASH_CURRENCY_IDS, isZcashCurrencyId } from "../currency";

describe("zcash currency ids", () => {
  it.each([
    ["zcash", true],
    ["zcash_testnet", true],
    ["zcash_regtest", false],
    ["bitcoin", false],
    ["bitcoin_testnet", false],
  ])("isZcashCurrencyId(%s) is %s", (id, expected) => {
    expect(isZcashCurrencyId(id)).toBe(expected);
  });

  it("registers the zcash chain adapter under every zcash currency id", () => {
    const mainnet = getChainAdapter("zcash");

    expect(mainnet).not.toBe(defaultAdapter);
    for (const id of ZCASH_CURRENCY_IDS) {
      const adapter = getChainAdapter(id);
      expect(adapter.id).toBe(id);
      expect(Object.keys(adapter).sort()).toEqual(Object.keys(mainnet).sort());
      expect(adapter.signOperation).toBe(mainnet.signOperation);
      expect(adapter.getTransactionStatus).toBe(mainnet.getTransactionStatus);
    }
  });

  it("leaves zcash_regtest on the default adapter", () => {
    expect(getChainAdapter("zcash_regtest")).toBe(defaultAdapter);
  });
});
