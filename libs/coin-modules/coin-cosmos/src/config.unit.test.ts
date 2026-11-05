import { cosmosDefaults, DEFAULT_GET_BLOCK_PAGINATION_LIMIT } from "./config";

describe("cosmos config", () => {
  it("paginates the transactions of a block 100 by 100 by default", () => {
    expect(DEFAULT_GET_BLOCK_PAGINATION_LIMIT).toBe(100);
  });

  it.each(Object.entries(cosmosDefaults))(
    "%s carries the default getBlock pagination limit",
    (_currencyId, config) => {
      expect(config.getBlock).toEqual({ pagination: { limit: 100 } });
    },
  );
});
