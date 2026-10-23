import { appConfigStorage } from "./storage";

describe("appConfigStorage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("persists the selections and the dev values as JSON under their own localStorage key", () => {
    appConfigStorage.selections.set("ledgerKeyRing", "dev");
    appConfigStorage.devValues.set("keycloakBaseUrl", "http://localhost:8080");

    expect(localStorage.getItem("appConfigSelections")).toBe(
      JSON.stringify({ ledgerKeyRing: "dev" }),
    );
    expect(localStorage.getItem("appConfigDevValues")).toBe(
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

    expect(localStorage.getItem("appConfigSelections")).toBeNull();
    expect(appConfigStorage.devValues.getAll()).toEqual({
      keycloakBaseUrl: "http://localhost:8080",
    });
  });
});
