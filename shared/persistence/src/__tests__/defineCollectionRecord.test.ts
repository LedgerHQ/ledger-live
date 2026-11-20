import { appendEntries, decodeEntries, encodeEntries } from "../collectionEntries";
import { defineCollectionRecord } from "../defineCollectionRecord";
import { RecordDecodeError } from "../errors";
import { storedSchemaSnapshot } from "../testing";

type Item = { id: string; value: number; transient?: string };
type State = { items: Item[]; labels: Record<string, string> };

const storedIdOf = (stored: unknown): string | undefined => {
  if (typeof stored !== "object" || stored === null || !("data" in stored)) return undefined;
  const { data } = stored;
  if (typeof data !== "object" || data === null || !("id" in data)) return undefined;
  return typeof data.id === "string" ? data.id : undefined;
};

const itemsRecord = defineCollectionRecord({
  key: "items",
  version: 0,
  entrySchema: z =>
    z.strictObject({
      data: z.looseObject({ id: z.string() }),
      version: z.number().int().min(0).max(2),
    }),
  entryId: (item: Item) => item.id,
  storedEntryId: storedIdOf,
  codec: {
    decode: async ({ data }) => {
      if (typeof data.value !== "number") throw new TypeError("value is not a number");
      return { id: data.id, value: data.value };
    },
    decodedId: item => item.id,
    encode: async (item: Item, state: State) => ({
      data: { id: item.id, value: item.value, label: state.labels[item.id] },
      version: 2,
    }),
  },
  state: {
    select: (state: State) => state.items,
    changed: (previous: Item, next: Item) => previous.value !== next.value,
    toHydrationActions: decoded => [{ type: "items/init", payload: decoded }],
  },
});

describe("defineCollectionRecord", () => {
  it("returns a frozen definition of kind collection", () => {
    expect(Object.isFrozen(itemsRecord)).toBe(true);
    expect(itemsRecord.kind).toBe("collection");
  });

  it("decodes a valid entry", async () => {
    await expect(
      itemsRecord.codec.decode({ data: { id: "a", value: 1 }, version: 2 }),
    ).resolves.toEqual({ id: "a", value: 1 });
  });

  it("refuses an entry above the known version, and an unknown envelope key", async () => {
    await expect(
      itemsRecord.codec.decode({ data: { id: "a", value: 1 }, version: 3 }),
    ).rejects.toThrow(RecordDecodeError);
    await expect(
      itemsRecord.codec.decode({ data: { id: "a", value: 1 }, version: 2, $v: 1 }),
    ).rejects.toThrow(RecordDecodeError);
  });

  it("keeps the stored value out of the decode error", async () => {
    const secret = "do-not-log-this";
    const error = await itemsRecord.codec
      .decode({ data: { id: 42, secret }, version: 2 })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(RecordDecodeError);
    expect(String(error)).not.toContain(secret);
  });
});

describe("decodeEntries", () => {
  it("keeps the good entries and reports each failure by index, with no value", async () => {
    const { decoded, failures } = await decodeEntries(itemsRecord.codec, [
      { data: { id: "a", value: 1 }, version: 2 },
      "not an entry",
      { data: { id: "c", value: "x" }, version: 2 },
      { data: { id: "d", value: 4 }, version: 0 },
      { data: { id: "e", value: 5 }, version: 3 },
    ]);

    expect(decoded).toEqual([
      { id: "a", value: 1 },
      { id: "d", value: 4 },
    ]);
    expect(failures.map(failure => failure.index)).toEqual([1, 2, 4]);
  });
});

describe("encodeEntries", () => {
  it("encodes each entry with the state, and leaves out the fields the record does not store", async () => {
    const state: State = {
      items: [
        { id: "a", value: 1, transient: "x" },
        { id: "b", value: 2 },
      ],
      labels: { a: "first", b: "second" },
    };

    await expect(encodeEntries(itemsRecord.codec, state.items, state)).resolves.toEqual([
      { data: { id: "a", value: 1, label: "first" }, version: 2 },
      { data: { id: "b", value: 2, label: "second" }, version: 2 },
    ]);
  });
});

describe("appendEntries", () => {
  it("keeps the stored entries as they are and adds only the new ids", () => {
    const unreadable = { data: { id: "b", value: "x" }, version: 9 };
    const stored = [{ data: { id: "a", value: 1 }, version: 2 }, unreadable, "garbage"];

    const result = appendEntries(itemsRecord.storedEntryId, stored, [
      { data: { id: "b", value: 2 }, version: 2 },
      { data: { id: "c", value: 3 }, version: 2 },
    ]);

    expect(result).toEqual([...stored, { data: { id: "c", value: 3 }, version: 2 }]);
    expect(result[1]).toBe(unreadable);
  });
});

describe("storedSchemaSnapshot of a collection", () => {
  it("returns the key, the version and the entry JSON schema", () => {
    expect(storedSchemaSnapshot(itemsRecord)).toMatchInlineSnapshot(`
      {
        "entrySchema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "data": {
              "additionalProperties": {},
              "properties": {
                "id": {
                  "type": "string",
                },
              },
              "required": [
                "id",
              ],
              "type": "object",
            },
            "version": {
              "maximum": 2,
              "minimum": 0,
              "type": "integer",
            },
          },
          "required": [
            "data",
            "version",
          ],
          "type": "object",
        },
        "key": "items",
        "version": 0,
      }
    `);
  });
});
