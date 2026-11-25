import { storedSchemaSnapshot } from "@shared/persistence/testing";
import { historyRecord, historyVersions } from "../history";
import storedDate from "./__fixtures__/history.date.json";
import storedNull from "./__fixtures__/history.null.json";

describe("history record", () => {
  it("keeps the stored schema", () => {
    expect(storedSchemaSnapshot(historyRecord, 0)).toMatchInlineSnapshot(`
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

  it.each([
    ["date", storedDate],
    ["null", storedNull],
  ])("upgrades the %s sample to the latest version", (_label, sample) => {
    expect(historyVersions.decode(sample, "history")).toEqual(sample);
  });
});
