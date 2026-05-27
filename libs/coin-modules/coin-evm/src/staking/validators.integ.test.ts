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
    expect(validator.name).toMatch(/^Validator \d+$/);
    expect(validator.tokens).toBeGreaterThan(0);
    expect(validator.commission).toBeGreaterThanOrEqual(0);
    expect(validator.commission).toBeLessThanOrEqual(1);
  });
});
