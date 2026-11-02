import { describe, expect, it, jest } from "@jest/globals";
import { jsonConfigStorage, readOnlyConfigStorage } from "./storage";

describe("readOnlyConfigStorage", () => {
  it("reads what it is given only when the entries are read", () => {
    const read = jest.fn(() => ({ backend: "staging" }));
    const storage = readOnlyConfigStorage(read);

    expect(read).not.toHaveBeenCalled();
    expect(storage.getAll()).toEqual({ backend: "staging" });
  });

  it("writes nothing", () => {
    const entries = { backend: "staging" };
    const storage = readOnlyConfigStorage(() => entries);

    storage.set("backend", "prod");
    storage.remove("backend");
    storage.clear();

    expect(storage.getAll()).toEqual({ backend: "staging" });
  });
});

describe("jsonConfigStorage", () => {
  it.each([null, undefined])("holds no entries while its key reads %s", unset => {
    const storage = jsonConfigStorage({ get: () => unset, set() {}, remove() {} });

    expect(storage.getAll()).toEqual({});
  });

  it("saves the entries as JSON, keeping the other entries", () => {
    const { storage, saved } = createStorage();

    storage.set("ledgerKeyRing", "prod");
    storage.set("otherSwitch", "prod");
    storage.set("ledgerKeyRing", "staging");

    expect(storage.getAll()).toEqual({ ledgerKeyRing: "staging", otherSwitch: "prod" });
    expect(saved()).toBe(JSON.stringify({ ledgerKeyRing: "staging", otherSwitch: "prod" }));
  });

  it("removes one entry, keeping the other entries", () => {
    const { storage } = createStorage(JSON.stringify({ ledgerKeyRing: "staging", other: "prod" }));

    storage.remove("ledgerKeyRing");

    expect(storage.getAll()).toEqual({ other: "prod" });
  });

  it.each(["{not json", "null"])("replaces %s when saving or removing an entry", content => {
    const removing = createStorage(content);
    removing.storage.remove("ledgerKeyRing");
    expect(removing.storage.getAll()).toEqual({});

    const saving = createStorage(content);
    saving.storage.set("ledgerKeyRing", "prod");
    expect(saving.storage.getAll()).toEqual({ ledgerKeyRing: "prod" });
  });

  it("throws on unreadable entries when reading them all, so the boot can clear them", () => {
    expect(() => createStorage("{not json").storage.getAll()).toThrow(SyntaxError);
  });

  it("removes its string on clear", () => {
    const { storage, saved } = createStorage(JSON.stringify({ ledgerKeyRing: "staging" }));

    storage.clear();

    expect(saved()).toBeUndefined();
  });
});

/** A `jsonConfigStorage` over an in-memory string, `undefined` while unset. */
function createStorage(initial?: string) {
  let saved = initial;
  const storage = jsonConfigStorage({
    get: () => saved,
    set: value => {
      saved = value;
    },
    remove: () => {
      saved = undefined;
    },
  });
  return { storage, saved: () => saved };
}
