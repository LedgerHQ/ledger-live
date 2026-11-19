import { defineRecord } from "../defineRecord";
import { RecordDecodeError } from "../errors";
import { storedSchemaSnapshot } from "../testing";

type State = { counter: { value: number; transient: string } };

const counterRecord = defineRecord({
  key: "counter",
  version: 0,
  schema: z => z.object({ value: z.number() }),
  codec: {
    encode: (counter: State["counter"]) => ({ value: counter.value }),
    decode: stored => ({ value: stored.value, transient: "" }),
  },
  state: {
    select: (state: State) => state.counter,
    toHydrationAction: counter => ({ type: "counter/init", payload: counter }),
  },
});

describe("defineRecord", () => {
  it("returns a frozen definition", () => {
    expect(Object.isFrozen(counterRecord)).toBe(true);
  });

  it("selects the slice by reference", () => {
    const state: State = { counter: { value: 1, transient: "x" } };
    expect(counterRecord.state.select(state)).toBe(state.counter);
  });

  it("encodes the slice", () => {
    expect(counterRecord.codec.encode({ value: 3, transient: "x" })).toEqual({ value: 3 });
  });

  it("decodes a valid stored value to the slice, and gives the hydration action", () => {
    const slice = counterRecord.codec.decode({ value: 4 });
    expect(slice).toEqual({ value: 4, transient: "" });
    expect(counterRecord.state.toHydrationAction(slice)).toEqual({
      type: "counter/init",
      payload: { value: 4, transient: "" },
    });
  });

  it("throws a RecordDecodeError for an invalid stored value", () => {
    expect(() => counterRecord.codec.decode({ value: "4" })).toThrow(RecordDecodeError);
  });

  it("keeps the stored value out of the error message", () => {
    const secret = "do-not-log-this";
    const decodeSecret = () => counterRecord.codec.decode({ value: secret });
    expect(decodeSecret).toThrow(expect.objectContaining({ key: "counter", version: 0 }));
    expect(decodeSecret).not.toThrow(secret);
  });
});

describe("storedSchemaSnapshot", () => {
  it("returns the key, the version and the JSON schema", () => {
    expect(storedSchemaSnapshot(counterRecord)).toMatchInlineSnapshot(`
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
});
