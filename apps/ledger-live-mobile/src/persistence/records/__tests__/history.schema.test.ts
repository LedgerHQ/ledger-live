import { storedSchemaSnapshot } from "@shared/persistence/testing";
import { historyRecord } from "../history";

describe("history record", () => {
  it("keeps the stored schema", () => {
    expect(storedSchemaSnapshot(historyRecord)).toMatchInlineSnapshot(`
      {
        "key": "history",
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "lastSeenOperationDate": {
              "type": [
                "string",
                "null",
              ],
            },
          },
          "required": [
            "lastSeenOperationDate",
          ],
          "type": "object",
        },
        "version": 0,
      }
    `);
  });
});
