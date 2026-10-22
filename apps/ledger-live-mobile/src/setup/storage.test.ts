import { createMMKV } from "react-native-mmkv";
import { appConfigStorage } from "./storage";

describe("appConfigStorage", () => {
  const mmkv = jest.mocked(createMMKV).mock.results[0].value;

  afterEach(() => {
    appConfigStorage.clear();
  });

  it("persists the selections as JSON under one key of the app-config MMKV instance", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");

    expect(createMMKV).toHaveBeenCalledWith({ id: "app-config" });
    expect(mmkv.getString("appConfigSelections")).toBe(
      JSON.stringify({ ledgerKeyRing: "staging" }),
    );
    expect(appConfigStorage.getAll()).toEqual({ ledgerKeyRing: "staging" });
  });

  it("clears the selections", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");

    appConfigStorage.clear();

    expect(mmkv.contains("appConfigSelections")).toBe(false);
  });
});
