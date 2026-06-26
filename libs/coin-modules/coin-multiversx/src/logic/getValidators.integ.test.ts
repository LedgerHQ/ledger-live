import MultiversXApiClient from "../api/apiCalls";
import { getValidators } from "./getValidators";

const API_ENDPOINT = "https://elrond.coin.ledger.com";
const DELEGATION_API_ENDPOINT = "https://delegations-elrond.coin.ledger.com";
const api = new MultiversXApiClient(API_ENDPOINT, DELEGATION_API_ENDPOINT);

jest.setTimeout(120_000);

describe("getValidators (integration)", () => {
  it("returns a non-empty single page of well-formed validators", async () => {
    const page = await getValidators(api);

    expect(page.next).toBeUndefined();
    expect(page.items.length).toBeGreaterThan(0);

    const sample = page.items.slice(0, 25);
    for (const validator of sample) {
      expect(typeof validator.address).toBe("string");
      expect(validator.address).toMatch(/^erd1/);
      expect(typeof validator.name).toBe("string");
      expect(validator.name.length).toBeGreaterThan(0);
      expect(typeof validator.balance).toBe("bigint");
      expect(validator.balance).toBeGreaterThanOrEqual(0n);
      expect(typeof validator.commissionRate).toBe("string");
      // apy is a decimal in [0, 1] when present, otherwise undefined.
      expect(validator.apy === undefined || typeof validator.apy === "number").toBe(true);
    }

    // APY range check, without a conditional expect: only defined APYs remain.
    for (const apy of sample.map(v => v.apy).filter((a): a is number => a !== undefined)) {
      expect(apy).toBeGreaterThanOrEqual(0);
      expect(apy).toBeLessThanOrEqual(1);
    }
  });
});
