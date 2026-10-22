import { appConfigStorage } from "./storage";

describe("appConfigStorage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("persists the selections as JSON under the appConfigSelections localStorage key", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");

    expect(localStorage.getItem("appConfigSelections")).toBe(
      JSON.stringify({ ledgerKeyRing: "staging" }),
    );
    expect(appConfigStorage.getAll()).toEqual({ ledgerKeyRing: "staging" });
  });

  it("clears the selections", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");

    appConfigStorage.clear();

    expect(localStorage.getItem("appConfigSelections")).toBeNull();
  });
});
