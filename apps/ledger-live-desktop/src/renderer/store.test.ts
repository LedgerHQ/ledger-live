import { store as storeBridge } from "~/renderer/bridge";
import { getStoreValue, resetStore, setStoreValue } from "./store";

jest.mock("~/renderer/bridge", () => ({
  bootstrap: { store: { "my-app-theme": { mode: "dark" }, "protect-STATE": "" } },
  store: { set: jest.fn(), clear: jest.fn() },
}));

describe("renderer store", () => {
  it("should read a dotted key persisted as a nested value by a previous session", () => {
    expect(getStoreValue("theme.mode", "my-app")).toBe("dark");
  });

  it("should read back a dotted key written in this session", () => {
    setStoreValue("layout.size", "large", "my-app");

    expect(getStoreValue("layout.size", "my-app")).toBe("large");
    expect(storeBridge.set).toHaveBeenCalledWith("my-app-layout.size", "large");
  });

  it("should return undefined for an empty value", () => {
    expect(getStoreValue("STATE", "protect")).toBeUndefined();
  });

  it("should forget every value on reset", () => {
    resetStore();

    expect(getStoreValue("theme.mode", "my-app")).toBeUndefined();
    expect(storeBridge.clear).toHaveBeenCalled();
  });
});
