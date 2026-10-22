import { createMMKV } from "react-native-mmkv";
import { appConfigStorage } from "./storage";

describe("appConfigStorage", () => {
  afterEach(() => {
    appConfigStorage.clear();
  });

  it("persists the selections in the dedicated app-config MMKV instance", () => {
    expect(createMMKV).toHaveBeenCalledWith({ id: "app-config" });
  });

  it("holds no selections by default", () => {
    expect(appConfigStorage.getAll()).toEqual({});
  });

  it("persists one key per switch", () => {
    appConfigStorage.set("ledgerKeyRing", "prod");
    appConfigStorage.set("otherSwitch", "prod");
    appConfigStorage.set("ledgerKeyRing", "staging");

    expect(appConfigStorage.getAll()).toEqual({ ledgerKeyRing: "staging", otherSwitch: "prod" });
  });

  it("clears the selections", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");

    appConfigStorage.clear();

    expect(appConfigStorage.getAll()).toEqual({});
  });
});
