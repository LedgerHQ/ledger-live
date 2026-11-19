import { decodeEntries, encodeEntries } from "@shared/persistence";
import { storedSchemaSnapshot } from "@shared/persistence/testing";
import { defineAccountsCodec, defineAccountsRecord } from "../defineAccountsRecord";

type FakeAccount = { id: string; balance: string };
type FakeState = { accounts: FakeAccount[]; names: Record<string, string> };

const record = defineAccountsRecord({
  codec: {
    decode: async ({ data, version }) => ({ id: data.id, version }),
    decodedId: decoded => decoded.id,
    encode: async (account: FakeAccount, state: FakeState) => ({
      data: { ...account, currencyId: "bitcoin", name: state.names[account.id] },
      version: 3,
    }),
  },
  state: {
    select: (state: FakeState) => state.accounts,
    changed: (previous: FakeAccount, next: FakeAccount) => previous.balance !== next.balance,
    toHydrationActions: decoded => [{ type: "INIT_ACCOUNTS", payload: [...decoded] }],
  },
});

const stored = (id: string, version: number) => ({
  data: { id, currencyId: "bitcoin" },
  version,
});

describe("defineAccountsRecord", () => {
  it("gives each stored account to the app codec, with its stored version", async () => {
    const { decoded, failures } = await decodeEntries(record.codec, [
      stored("a", 0),
      stored("b", 3),
    ]);
    expect(failures).toEqual([]);
    expect(decoded).toEqual([
      { id: "a", version: 0 },
      { id: "b", version: 3 },
    ]);
  });

  it.each([
    ["a version above the line", stored("b", 4)],
    ["an unknown envelope key", { ...stored("b", 3), $v: 1 }],
  ])("does not decode an account with %s: a newer app wrote it", async (_label, newer) => {
    const { decoded, failures } = await decodeEntries(record.codec, [stored("a", 3), newer]);
    expect(decoded).toEqual([{ id: "a", version: 3 }]);
    expect(failures.map(failure => failure.index)).toEqual([1]);
  });

  it("encodes each account with the state", async () => {
    const state: FakeState = { accounts: [{ id: "a", balance: "1" }], names: { a: "Savings" } };
    await expect(encodeEntries(record.codec, state.accounts, state)).resolves.toEqual([
      { data: { id: "a", balance: "1", currencyId: "bitcoin", name: "Savings" }, version: 3 },
    ]);
  });

  it("gives the tools the same codec with no state", async () => {
    const codec = defineAccountsCodec({
      decode: async ({ data }) => data.id,
      decodedId: id => id,
      encode: async (id: string) => ({ data: { id, currencyId: "bitcoin" }, version: 1 }),
    });
    await expect(decodeEntries(codec, [stored("a", 1), stored("b", 4)])).resolves.toEqual({
      decoded: ["a"],
      failures: [expect.objectContaining({ index: 1 })],
    });
  });

  it("reads the id of a stored account without a decode", () => {
    expect(record.storedEntryId(stored("a", 9))).toBe("a");
    expect(record.storedEntryId({ data: { id: 42 } })).toBeUndefined();
    expect(record.storedEntryId("garbage")).toBeUndefined();
  });

  it("keeps the stored entry schema", () => {
    expect(storedSchemaSnapshot(record)).toMatchInlineSnapshot(`
      {
        "entrySchema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "data": {
              "additionalProperties": {},
              "properties": {
                "currencyId": {
                  "type": "string",
                },
                "id": {
                  "type": "string",
                },
              },
              "required": [
                "id",
                "currencyId",
              ],
              "type": "object",
            },
            "version": {
              "maximum": 3,
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
        "key": "accounts",
        "version": 0,
      }
    `);
  });
});
