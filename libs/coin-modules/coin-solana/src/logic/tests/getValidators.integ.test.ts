import { getValidators } from "../getValidators";

describe("getValidators (integration)", () => {
  it("returns a non-empty page of well-formed validators for mainnet-beta", async () => {
    const page = await getValidators(
      "https://validators-solana.coin.ledger.com/api/v1/validators/mainnet.json",
    );

    expect(page).toMatchObject({ next: undefined });
    expect(page.items.length).toBeGreaterThan(100);

    for (const validator of page.items) {
      expect(typeof validator.address).toBe("string");
      expect(validator.address.length).toBeGreaterThan(0);
      expect(typeof validator.name).toBe("string");
      expect(typeof validator.balance).toBe("bigint");
      expect(validator.balance).toBeGreaterThanOrEqual(0n);
      expect(typeof validator.commissionRate).toBe("string");
      expect(["undefined", "number"]).toContain(typeof validator.apy);
    }
  });

  it("returns an empty page when no validatorsUrl is provided", async () => {
    const page = await getValidators();
    expect(page).toStrictEqual({ items: [], next: undefined });
  });
});
