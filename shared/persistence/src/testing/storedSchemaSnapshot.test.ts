import { defineRecord } from "../defineRecord";
import { recordVersions, type RecordVersions } from "../recordVersions";
import { storedSchemaSnapshot } from "./storedSchemaSnapshot";

type State = { counter: { value: number } };

const counterRecord = defineRecord({
  key: "counter",
  versions: recordVersions(z => z.strictObject({ value: z.number() })).next(
    z => z.strictObject({ value: z.number(), unit: z.string() }),
    v0 => ({ ...v0, unit: "count" }),
  ),
  codec: {
    encode: (counter: State["counter"]) => ({ value: counter.value, unit: "count" }),
    decode: stored => ({ value: stored.value }),
  },
  state: {
    select: (state: State) => state.counter,
    toHydrationAction: counter => ({ type: "counter/init", payload: counter }),
  },
});

const counterRecordStoredAs = (versions: RecordVersions<State["counter"]>) =>
  defineRecord({
    key: "counter",
    versions,
    codec: { encode: (counter: State["counter"]) => counter, decode: stored => stored },
    state: {
      select: (state: State) => state.counter,
      toHydrationAction: counter => ({ type: "counter/init", payload: counter }),
    },
  });

describe("storedSchemaSnapshot", () => {
  it("should return the key, the version and the bare JSON schema when the version is v0", () => {
    expect(storedSchemaSnapshot(counterRecord, 0)).toMatchInlineSnapshot(`
      {
        "key": "counter",
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "value": {
              "type": "number",
            },
          },
          "required": [
            "value",
          ],
          "type": "object",
        },
        "version": 0,
      }
    `);
  });

  it("should return the $v envelope schema when the version is after v0", () => {
    expect(storedSchemaSnapshot(counterRecord, 1).schema).toMatchObject({
      additionalProperties: false,
      properties: { $v: { const: 1 }, data: { required: ["value", "unit"] } },
    });
  });

  it("should give a different snapshot when a v0 schema strips unknown keys instead of refusing them", () => {
    const refusing = counterRecordStoredAs(
      recordVersions(z => z.strictObject({ value: z.number() })),
    );
    const stripping = counterRecordStoredAs(recordVersions(z => z.object({ value: z.number() })));

    expect(storedSchemaSnapshot(refusing, 0).schema).toHaveProperty("additionalProperties", false);
    expect(storedSchemaSnapshot(stripping, 0).schema).not.toHaveProperty("additionalProperties");
  });

  it("should throw a RangeError when the record does not have the version", () => {
    expect(() => storedSchemaSnapshot(counterRecord, 2)).toThrow(RangeError);
  });
});
