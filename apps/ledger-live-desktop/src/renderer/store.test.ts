import { store as storeBridge } from "~/renderer/bridge";
import { getStoreValue, resetStore, setStoreValue } from "./store";

jest.mock("~/renderer/bridge", () => ({
  bootstrap: {
    store: Object.freeze({
      "my-app-theme": Object.freeze({ mode: "dark" }),
      "my-app-a.b": "literal",
      "my-app-flag": "on",
      "my-app-locale": "fr",
      "protect-STATE": "",
    }),
  },
  store: {
    set: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

const pendingSet = () => {
  let reject!: (error: Error) => void;
  jest
    .mocked(storeBridge.set)
    .mockReturnValueOnce(new Promise((_resolve, rejectSet) => (reject = rejectSet)));
  return reject;
};

describe("renderer store", () => {
  it("should read a dotted key persisted as a nested value by a previous session", () => {
    expect(getStoreValue("theme.mode", "my-app")).toBe("dark");
  });

  it("should write over a value from the frozen bootstrap snapshot", async () => {
    await setStoreValue("theme.mode", "light", "my-app");

    expect(getStoreValue("theme.mode", "my-app")).toBe("light");
  });

  it("should read back a dotted key written in this session", async () => {
    await setStoreValue("layout.size", "large", "my-app");

    expect(getStoreValue("layout.size", "my-app")).toBe("large");
    expect(storeBridge.set).toHaveBeenCalledWith("my-app-layout.size", "large");
  });

  it("should read an escaped dot as part of the key, like electron-store", () => {
    expect(getStoreValue("a\\.b", "my-app")).toBe("literal");
  });

  it("should read back an escaped key written in this session", async () => {
    await setStoreValue("c\\.d", "value", "my-app");

    expect(getStoreValue("c\\.d", "my-app")).toBe("value");
    expect(storeBridge.set).toHaveBeenCalledWith("my-app-c\\.d", "value");
  });

  it("should create objects for numeric segments, like electron-store", async () => {
    await setStoreValue("items.0.name", "first", "my-app");

    expect(getStoreValue("items", "my-app")).toStrictEqual({ "0": { name: "first" } });
  });

  it("should replace a primitive parent with an object, like electron-store", async () => {
    await setStoreValue("flag.enabled", true, "my-app");

    expect(getStoreValue("flag", "my-app")).toStrictEqual({ enabled: true });
  });

  it("should keep an existing array, like electron-store", async () => {
    await setStoreValue("list", ["a", "b"], "my-app");
    await setStoreValue("list.0", "z", "my-app");

    expect(getStoreValue("list", "my-app")).toStrictEqual(["z", "b"]);
  });

  it("should ignore prototype keys, like electron-store", async () => {
    await setStoreValue("theme.__proto__.polluted", "yes", "my-app");

    expect(getStoreValue("theme.__proto__.polluted", "my-app")).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("should return undefined for an empty value", () => {
    expect(getStoreValue("STATE", "protect")).toBeUndefined();
  });

  it("should bring the previous value back when main fails to persist a write", async () => {
    jest.mocked(storeBridge.set).mockRejectedValueOnce(new Error("EACCES"));

    await expect(setStoreValue("locale.region", "BE", "my-app")).rejects.toThrow("EACCES");

    expect(getStoreValue("locale", "my-app")).toBe("fr");
  });

  it("should forget a new key when main fails to persist it", async () => {
    jest.mocked(storeBridge.set).mockRejectedValueOnce(new Error("EACCES"));

    await expect(setStoreValue("fresh", "value", "my-app")).rejects.toThrow("EACCES");

    expect(getStoreValue("fresh", "my-app")).toBeUndefined();
  });

  it("should keep a concurrent write to another key when an earlier write fails", async () => {
    const rejectFirst = pendingSet();

    const first = setStoreValue("first", "a", "my-app");
    await setStoreValue("second", "b", "my-app");
    rejectFirst(new Error("EACCES"));

    await expect(first).rejects.toThrow("EACCES");
    expect(getStoreValue("first", "my-app")).toBeUndefined();
    expect(getStoreValue("second", "my-app")).toBe("b");
  });

  it("should keep a later write to the same key when an earlier write fails", async () => {
    const rejectFirst = pendingSet();

    const first = setStoreValue("mode", "a", "my-app");
    await setStoreValue("mode", "b", "my-app");
    rejectFirst(new Error("EACCES"));

    await expect(first).rejects.toThrow("EACCES");
    expect(getStoreValue("mode", "my-app")).toBe("b");
  });

  it("should keep every value when main fails to clear the store", async () => {
    jest.mocked(storeBridge.clear).mockRejectedValueOnce(new Error("EBUSY"));

    await expect(resetStore()).rejects.toThrow("EBUSY");

    expect(getStoreValue("a\\.b", "my-app")).toBe("literal");
  });

  it("should forget every value on reset", async () => {
    await resetStore();

    expect(getStoreValue("theme.mode", "my-app")).toBeUndefined();
    expect(storeBridge.clear).toHaveBeenCalled();
  });
});
