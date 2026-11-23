import { storedSchemaSnapshot } from "@shared/persistence/testing";
import { marketBannerRecord } from "../marketBanner";

describe("marketBanner record", () => {
  it("keeps the stored schema", () => {
    expect(storedSchemaSnapshot(marketBannerRecord)).toMatchInlineSnapshot(`
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
});
