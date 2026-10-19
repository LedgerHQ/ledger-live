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

  it("removes the selection of one switch, keeping the other switches", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");
    appConfigStorage.set("otherSwitch", "prod");

    appConfigStorage.remove("ledgerKeyRing");

    expect(appConfigStorage.getAll()).toEqual({ otherSwitch: "prod" });
  });

  it("replaces unreadable selections when saving or removing one", () => {
    localStorage.setItem("appConfigSelections", "{not json");

    appConfigStorage.remove("ledgerKeyRing");

    expect(appConfigStorage.getAll()).toEqual({});

    localStorage.setItem("appConfigSelections", "{not json");

    appConfigStorage.set("ledgerKeyRing", "prod");

    expect(appConfigStorage.getAll()).toEqual({ ledgerKeyRing: "prod" });
  });

  it("throws on unreadable selections when reading them all, so the boot can clear them", () => {
    localStorage.setItem("appConfigSelections", "{not json");

    expect(() => appConfigStorage.getAll()).toThrow(SyntaxError);
  });

  it("clears the selections", () => {
    appConfigStorage.set("ledgerKeyRing", "staging");

    appConfigStorage.clear();

    expect(localStorage.getItem("appConfigSelections")).toBeNull();
  });
});
