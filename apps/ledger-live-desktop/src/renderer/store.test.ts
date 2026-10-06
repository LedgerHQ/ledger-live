import { ipcRenderer } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { getStoreValue, resetStore, setStoreValue } from "./store";

jest.mock("~/renderer/bridge", () => ({
  bootstrap: {
    store: Object.freeze({
      "my-app-theme": Object.freeze({ mode: "dark" }),
      "my-app-a.b": "literal",
      "my-app-flag": "on",
      "protect-STATE": "",
    }),
  },
}));

describe("renderer store", () => {
  it("should read a dotted key persisted as a nested value by a previous session", () => {
    expect(getStoreValue("theme.mode", "my-app")).toBe("dark");
  });

  it("should write over a value from the frozen bootstrap snapshot", () => {
    setStoreValue("theme.mode", "light", "my-app");

    expect(getStoreValue("theme.mode", "my-app")).toBe("light");
  });

  it("should read back a dotted key written in this session", () => {
    setStoreValue("layout.size", "large", "my-app");

    expect(getStoreValue("layout.size", "my-app")).toBe("large");
    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.storeSet, "my-app-layout.size", "large");
  });

  it("should read an escaped dot as part of the key, like electron-store", () => {
    expect(getStoreValue("a\\.b", "my-app")).toBe("literal");
  });

  it("should read back an escaped key written in this session", () => {
    setStoreValue("c\\.d", "value", "my-app");

    expect(getStoreValue("c\\.d", "my-app")).toBe("value");
    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.storeSet, "my-app-c\\.d", "value");
  });

  it("should create objects for numeric segments, like electron-store", () => {
    setStoreValue("items.0.name", "first", "my-app");

    expect(getStoreValue("items", "my-app")).toStrictEqual({ "0": { name: "first" } });
  });

  it("should replace a primitive parent with an object, like electron-store", () => {
    setStoreValue("flag.enabled", true, "my-app");

    expect(getStoreValue("flag", "my-app")).toStrictEqual({ enabled: true });
  });

  it("should keep an existing array, like electron-store", () => {
    setStoreValue("list", ["a", "b"], "my-app");
    setStoreValue("list.0", "z", "my-app");

    expect(getStoreValue("list", "my-app")).toStrictEqual(["z", "b"]);
  });

  it("should ignore prototype keys, like electron-store", () => {
    setStoreValue("theme.__proto__.polluted", "yes", "my-app");

    expect(getStoreValue("theme.__proto__.polluted", "my-app")).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("should return undefined for an empty value", () => {
    expect(getStoreValue("STATE", "protect")).toBeUndefined();
  });

  it("should forget every value on reset", () => {
    resetStore();

    expect(getStoreValue("theme.mode", "my-app")).toBeUndefined();
    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.storeClear);
  });
});
