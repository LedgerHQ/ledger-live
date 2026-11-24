import { storedSchemaSnapshot } from "@shared/persistence/testing";
import { marketBannerRecord, marketBannerVersions } from "../marketBanner";
import storedFavorites from "./__fixtures__/marketBanner.favorites.json";

describe("marketBanner record", () => {
  it("keeps the stored schema", () => {
    expect(storedSchemaSnapshot(marketBannerRecord, 0)).toMatchInlineSnapshot(`
      {
        "key": "marketBanner",
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "ranking": {
              "enum": [
                "trending",
                "gainers",
                "losers",
                "favorites",
              ],
              "type": "string",
            },
          },
          "required": [
            "ranking",
          ],
          "type": "object",
        },
        "version": 0,
      }
    `);
  });

  it("upgrades the favorites sample to the latest version", () => {
    expect(marketBannerVersions.decode(storedFavorites, "marketBanner")).toEqual(storedFavorites);
  });
});
