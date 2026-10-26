import { createMMKV } from "react-native-mmkv";
import { appConfigStorage } from "./storage";

describe("appConfigStorage", () => {
  const mmkv = jest.mocked(createMMKV).mock.results[0].value;

  afterEach(() => {
    appConfigStorage.selections.clear();
    appConfigStorage.devValues.clear();
  });

  it("persists the selections and the dev values as JSON under their own key of the app-config MMKV instance", () => {
    appConfigStorage.selections.set("ledgerKeyRing", "dev");
    appConfigStorage.devValues.set("keycloakBaseUrl", "http://localhost:8080");

    expect(createMMKV).toHaveBeenCalledTimes(1);
    expect(createMMKV).toHaveBeenCalledWith({ id: "app-config" });
    expect(mmkv.getString("appConfigSelections")).toBe(JSON.stringify({ ledgerKeyRing: "dev" }));
    expect(mmkv.getString("appConfigDevValues")).toBe(
      JSON.stringify({ keycloakBaseUrl: "http://localhost:8080" }),
    );
    expect(appConfigStorage.selections.getAll()).toEqual({ ledgerKeyRing: "dev" });
    expect(appConfigStorage.devValues.getAll()).toEqual({
      keycloakBaseUrl: "http://localhost:8080",
    });
  });

  it("clears one storage, keeping the other", () => {
    appConfigStorage.selections.set("ledgerKeyRing", "dev");
    appConfigStorage.devValues.set("keycloakBaseUrl", "http://localhost:8080");

    appConfigStorage.selections.clear();

    expect(mmkv.contains("appConfigSelections")).toBe(false);
    expect(appConfigStorage.devValues.getAll()).toEqual({
      keycloakBaseUrl: "http://localhost:8080",
    });
  });
});
