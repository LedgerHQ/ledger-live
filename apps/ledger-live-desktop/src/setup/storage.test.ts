import { appConfigStorage } from "./storage";

describe("appConfigStorage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("holds no selections by default", () => {
    expect(appConfigStorage.getAll()).toEqual({});
  });

  it("persists the selections as JSON under appConfigSelections, keeping the other switches", () => {
    appConfigStorage.set("ledgerKeyRing", "prod");
    appConfigStorage.set("otherSwitch", "prod");
    appConfigStorage.set("ledgerKeyRing", "staging");

    expect(appConfigStorage.getAll()).toEqual({ ledgerKeyRing: "staging", otherSwitch: "prod" });
    expect(localStorage.getItem("appConfigSelections")).toBe(
      JSON.stringify({ ledgerKeyRing: "staging", otherSwitch: "prod" }),
    );
  });

  it("clears the selections", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");

    appConfigStorage.clear();

    expect(localStorage.getItem("appConfigSelections")).toBeNull();
  });
});
