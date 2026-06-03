import { EvmCoinConfig, setCoinConfig } from "../config";
import { getValidators } from "./validators";

describe("getValidators", () => {
  it.each([
    [
      "monad",
      {
        info: {
          node: {
            type: "external",
            uri: "https://monad.coin.ledger.com",
          },
        },
      } as EvmCoinConfig,
    ],
  ])("fetches validators on '%s'", async (currencyId, config) => {
    setCoinConfig(() => config);

    const firstPage = await getValidators(currencyId);
    expect(firstPage.items.length).toBeGreaterThan(0);

    const validator = firstPage.items[0];
    expect(validator.validatorAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    // Name is either resolved from the validator-info overlay or the `Validator {id}`
    // fallback — both are non-empty strings.
    expect(typeof validator.name).toBe("string");
    expect(validator.name.length).toBeGreaterThan(0);
    expect(BigInt(validator.tokens)).toBeGreaterThan(0n);
    expect(validator.commission).toBeGreaterThanOrEqual(0);
    expect(validator.commission).toBeLessThanOrEqual(1);
  });
});
