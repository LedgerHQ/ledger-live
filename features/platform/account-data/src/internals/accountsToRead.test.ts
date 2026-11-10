import { accountsToRead } from "./accountsToRead";

const store = {};
const next = (keys: string[], options = "o") => ({ store, options, keys });

describe("accountsToRead", () => {
  it("reads every account the first time", () => {
    expect(accountsToRead(undefined, next(["a", "b"])).toRead).toEqual(["a", "b"]);
  });

  it("reads only the added accounts, and none on a reorder", () => {
    const { record } = accountsToRead(undefined, next(["a", "b"]));
    expect(accountsToRead(record, next(["b", "c", "a"])).toRead).toEqual(["c"]);
    expect(accountsToRead(record, next(["b", "a"])).toRead).toEqual([]);
  });

  it("reads again an account removed then added back", () => {
    const first = accountsToRead(undefined, next(["a", "b"])).record;
    const shrunk = accountsToRead(first, next(["a"]));
    expect(shrunk.toRead).toEqual([]);
    expect(accountsToRead(shrunk.record, next(["a", "b"])).toRead).toEqual(["b"]);
  });

  it("reads every account again when the options or the store change", () => {
    const { record } = accountsToRead(undefined, next(["a", "b"]));
    expect(accountsToRead(record, next(["a", "b"], "other")).toRead).toEqual(["a", "b"]);
    expect(accountsToRead(record, { ...next(["a", "b"]), store: {} }).toRead).toEqual(["a", "b"]);
  });
});
