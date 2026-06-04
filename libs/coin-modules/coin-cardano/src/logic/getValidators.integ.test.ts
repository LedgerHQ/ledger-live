import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getValidators } from "./getValidators";

describe("getValidators (integration)", () => {
  it("fetches stake pools from the Cardano testnet API and maps them to validators", async () => {
    const currency = getCryptoCurrencyById("cardano_testnet");

    const { items, next } = await getValidators(currency);

    // All pools are returned in a single page (the framework consumer doesn't follow a cursor).
    expect(next).toBeUndefined();
    expect(items.length).toBeGreaterThan(0);

    const validator = items[0];
    expect(typeof validator.address).toBe("string");
    expect(validator.address.length).toBeGreaterThan(0);
    expect(typeof validator.name).toBe("string");
    expect(validator.name.length).toBeGreaterThan(0);
    expect(typeof validator.balance).toBe("bigint");
    expect(validator.balance).toBeGreaterThanOrEqual(0n);
    expect(typeof validator.commissionRate).toBe("string");

    // APY is gated on the epoch-params endpoint exposing reserves + active stake (LIVE-18622).
    // Until then it stays omitted; when present it must be a sane fraction in (0, 1).
    for (const v of items) {
      if (v.apy !== undefined) {
        expect(v.apy).toBeGreaterThan(0);
        expect(v.apy).toBeLessThan(1);
      }
    }
  });
});
